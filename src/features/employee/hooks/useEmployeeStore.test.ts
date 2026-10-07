import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../../../types/identity';
import type { EmployeeMission } from '../types/employee';
import * as demoService from '../services/mockEmployeeService';
import { getElapsedMs, getProgress } from '../services/missionRules';
import { useEmployeeStore } from './useEmployeeStore';

const employee = (id: string): User => ({ id, firstName: 'Meryem', lastName: 'Alaoui', email: `${id}@magiquepro.ca`, role: 'EMPLOYEE' });
const store = () => useEmployeeStore.getState();
const mission = (id: string) => store().missions.find(item => item.id === id)!;
const completeRequired = (id: string) => mission(id).tasks.filter(task => task.required).forEach(task => store().updateTask(id, task.id, { status: 'DONE' }));
async function load() { store().bindOwner(employee('a')); await store().load(); return store().missions[0]!.id; }

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-07T14:00:00.000Z'));
  store().bindOwner(null);
});
afterEach(() => { store().bindOwner(null); vi.useRealTimers(); });

describe('employee mission lifecycle', () => {
  it('starts once, retains progress on reload, and never auto-completes a checklist', async () => {
    const id = await load();
    store().startMission(id);
    const startedAt = mission(id).startedAt;
    vi.advanceTimersByTime(60000);
    store().startMission(id);
    completeRequired(id);
    await store().load();
    expect(mission(id)).toMatchObject({ status: 'IN_PROGRESS', startedAt });
    expect(getElapsedMs(mission(id))).toBe(60000);
    expect(getProgress(mission(id))).toMatchObject({ done: 5, total: 6, remaining: 1 });
    expect(mission(id).endedAt).toBeUndefined();
  });

  it('requires mandatory tasks and a reason for allowed exceptions, without demanding optional tasks', async () => {
    const id = await load();
    store().startMission(id);
    expect(store().finishIntervention(id)).toHaveProperty('tasks');
    expect(mission(id).endedAt).toBeUndefined();
    completeRequired(id);
    const exception = mission(id).tasks.find(task => task.required && task.allowNotApplicable)!;
    store().updateTask(id, exception.id, { status: 'NOT_APPLICABLE' });
    expect(store().finishIntervention(id)).toHaveProperty(exception.id);
    store().updateTask(id, exception.id, { justification: 'Fenêtre inaccessible derrière un meuble.' });
    expect(getProgress(mission(id))).toMatchObject({ done: 4, notApplicable: 1, remaining: 1 });
    expect(store().finishIntervention(id)).toEqual({});
    expect(mission(id).status).toBe('REPORT_PENDING');
  });

  it('keeps the end time and checklist frozen while the report remains editable', async () => {
    const id = await load();
    store().startMission(id);
    completeRequired(id);
    store().setIncident(id, 'La poignée de la fenêtre est endommagée.');
    vi.advanceTimersByTime(90 * 60000);
    store().finishIntervention(id);
    const closed = mission(id);
    vi.advanceTimersByTime(30 * 60000);
    store().startMission(id);
    store().updateTask(id, closed.tasks[0]!.id, { status: 'TODO' });
    store().setIncident(id, 'modification interdite');
    expect(store().finishIntervention(id)).toHaveProperty('status');
    expect(mission(id).endedAt).toBe(closed.endedAt);
    expect(mission(id).tasks).toEqual(closed.tasks);
    expect(mission(id).incident).toBe(closed.incident);
    expect(getElapsedMs(mission(id))).toBe(90 * 60000);
    expect(mission(id).report).toMatchObject({ hasIncident: true, incidentDescription: closed.incident });
  });

  it('preserves an incomplete draft and validates the report before completing the mission', async () => {
    const id = await load();
    store().startMission(id);
    completeRequired(id);
    store().finishIntervention(id);
    store().updateReport(id, { summary: 'Ménage', hasIncident: true, incidentDescription: '' });
    store().saveDraft(id);
    expect(mission(id).report.savedAt).toBeDefined();
    expect(mission(id).report.validatedAt).toBeUndefined();
    expect(store().validateReport(id)).toMatchObject({ summary: expect.any(String), incidentDescription: expect.any(String) });
    await store().load();
    expect(mission(id).report.summary).toBe('Ménage');
    expect(mission(id).status).toBe('REPORT_PENDING');
    store().updateReport(id, { summary: 'Toutes les surfaces prévues ont été nettoyées.', incidentDescription: 'Un carreau était déjà fissuré à l’arrivée.' });
    expect(store().validateReport(id)).toEqual({});
    const completed = mission(id);
    expect(completed.status).toBe('COMPLETED');
    expect(completed.report.validatedAt).toBeDefined();
    store().updateReport(id, { summary: 'Tentative de modification' });
    store().saveDraft(id);
    store().updateTask(id, completed.tasks[0]!.id, { status: 'TODO' });
    store().setIncident(id, 'Autre incident');
    store().startMission(id);
    expect(store().validateReport(id)).toHaveProperty('status');
    expect(mission(id)).toEqual(completed);
  });

  it('rejects out-of-order edits, forbidden exceptions and unknown missions', async () => {
    const id = await load();
    const initial = mission(id);
    store().updateTask(id, initial.tasks[0]!.id, { status: 'DONE' });
    store().setIncident(id, 'Texte');
    store().updateReport(id, { summary: 'Résumé anticipé' });
    store().saveDraft(id);
    expect(mission(id)).toEqual(initial);
    expect(store().finishIntervention(id)).toHaveProperty('status');
    expect(store().validateReport(id)).toHaveProperty('status');
    expect(store().finishIntervention('unknown')).toHaveProperty('status');
    expect(store().validateReport('unknown')).toHaveProperty('status');
    store().startMission(id);
    store().updateTask(id, initial.tasks[0]!.id, { status: 'NOT_APPLICABLE', justification: 'Non autorisé' });
    expect(mission(id).tasks[0]!.status).toBe('TODO');
  });

  it('ignores fabricated report validation timestamps and deduplicates/caps optional photos', async () => {
    const id = await load();
    store().startMission(id);
    completeRequired(id);
    store().finishIntervention(id);
    const photos = Array.from({ length: 7 }, (_, index) => ({ id: String(index), uri: `file:///photo-${index}.jpg`, name: `${index}.jpg` }));
    store().updateReport(id, { validatedAt: 'fake', savedAt: 'fake', photos: [photos[0]!, ...photos] });
    expect(mission(id).report).toMatchObject({ photos: photos.slice(0, 5) });
    expect(mission(id).report.validatedAt).toBeUndefined();
    expect(mission(id).report.savedAt).toBeUndefined();
  });
});

describe('employee ownership and loading', () => {
  it('prefills onboarding, preserves the same owner and clears data on account changes/logout', async () => {
    const id = await load();
    expect(store().profile).toMatchObject({ firstName: 'Meryem', phone: '' });
    store().completeOnboarding({ ...store().profile!, phone: '514 555-0123' });
    store().startMission(id);
    completeRequired(id);
    store().finishIntervention(id);
    store().updateReport(id, { summary: 'Informations privées employé A' });
    store().bindOwner(employee('a'));
    expect(store().onboarded).toBe(true);
    expect(mission(id).report.summary).toContain('privées');
    store().bindOwner(employee('b'));
    expect(store()).toMatchObject({ ownerId: 'b', onboarded: false, missions: [], loading: false });
    await store().load();
    expect(store().missions.every(item => item.id.startsWith('b-') && !item.report.summary)).toBe(true);
    store().bindOwner(null);
    expect(store()).toMatchObject({ ownerId: null, profile: null, missions: [], onboarded: false });
    store().bindOwner({ ...employee('a'), role: 'CLIENT' });
    await store().load();
    expect(store().missions).toEqual([]);
  });

  it('does not expose a stale async load after switching away and back to the same employee', async () => {
    let resolve!: (missions: EmployeeMission[]) => void;
    vi.spyOn(demoService, 'getEmployeeMissions').mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    store().bindOwner(employee('a'));
    const pending = store().load();
    expect(store().loading).toBe(true);
    store().bindOwner(employee('b'));
    store().bindOwner(employee('a'));
    const stale = demoService.createDemoEmployeeMissions('a');
    stale[0]!.report.summary = 'Ancien brouillon';
    resolve(stale);
    await pending;
    expect(store().missions).toEqual([]);
    await store().load();
    expect(store().missions[0]!.report.summary).toBe('');
  });

  it('exposes a recoverable loading error and supports a legitimately empty mission list', async () => {
    const api = vi.spyOn(demoService, 'getEmployeeMissions').mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
    store().bindOwner(employee('a'));
    await store().load();
    expect(store()).toMatchObject({ loading: false, error: expect.any(String), missions: [] });
    await store().load();
    expect(store()).toMatchObject({ loading: false, error: undefined, missions: [] });
    await store().load();
    expect(api).toHaveBeenCalledTimes(2);
  });
});
