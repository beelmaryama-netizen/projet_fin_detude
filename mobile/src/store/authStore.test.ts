import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Session, UserRole } from '../types/identity';
import type { EmployeeMission } from '../features/employee/types/employee';
import { useEmployeeStore } from '../features/employee/hooks/useEmployeeStore';
import * as employeeService from '../features/employee/services/mockEmployeeService';
import { useRequestDraftStore } from './requestDraftStore';
import { useAuthStore } from './authStore';

const session = (id: string, role: UserRole = 'EMPLOYEE'): Session => ({
  user: { id, role, firstName: id, lastName: 'Démo', email: `${id}@magicpro.demo` },
  accessToken: `access-${id}`, refreshToken: `refresh-${id}`, expiresAt: Date.now() + 900_000,
});

async function preparePrivateEmployeeData(id = 'employee-a') {
  useAuthStore.getState().setSession(session(id));
  await useEmployeeStore.getState().load();
  const state = useEmployeeStore.getState();
  const mission = state.missions[0]!;
  state.completeOnboarding({ ...state.profile!, phone: '514 555 0111' });
  state.startMission(mission.id);
  for (const task of mission.tasks) state.updateTask(mission.id, task.id, { status: 'DONE', comment: 'Note confidentielle' });
  state.setIncident(mission.id, 'Observation privée');
  expect(state.finishIntervention(mission.id)).toEqual({});
  state.updateReport(mission.id, {
    summary: 'Résumé privé de cette intervention.',
    photos: [{ id: 'private-photo', uri: 'file:///private-report.jpg', name: 'Photo privée' }],
  });
  state.saveDraft(mission.id);
  return mission.id;
}

afterEach(() => {
  useAuthStore.getState().clearSession();
  vi.restoreAllMocks();
});

describe('authentication boundaries for employee and client data', () => {
  it('binds employee identity and preserves the same employee draft when renewing a session', async () => {
    const missionId = await preparePrivateEmployeeData();
    const previous = useEmployeeStore.getState();
    const missions = previous.missions;
    useAuthStore.getState().setSession({ ...session('employee-a'), accessToken: 'renewed-access' });
    const employee = useEmployeeStore.getState();
    expect(employee.ownerId).toBe('employee-a');
    expect(employee.profile).toMatchObject({ firstName: 'employee-a', email: 'employee-a@magicpro.demo', phone: '514 555 0111' });
    expect(employee.onboarded).toBe(true);
    expect(employee.missions).toBe(missions);
    expect(employee.missions.find(mission => mission.id === missionId)?.report).toMatchObject({
      summary: 'Résumé privé de cette intervention.', photos: [{ uri: 'file:///private-report.jpg', id: 'private-photo', name: 'Photo privée' }],
    });
    expect(useRequestDraftStore.getState().ownerId).toBeNull();
  });

  it('clears mission reports, checklist notes, photos and profile when another employee signs in', async () => {
    const previousMissionId = await preparePrivateEmployeeData();
    useAuthStore.getState().setSession(session('employee-b'));
    expect(useEmployeeStore.getState()).toMatchObject({
      ownerId: 'employee-b', missions: [], onboarded: false, loading: false,
      profile: { firstName: 'employee-b', email: 'employee-b@magicpro.demo', phone: '' },
    });
    await useEmployeeStore.getState().load();
    const missions = useEmployeeStore.getState().missions;
    expect(missions.length).toBeGreaterThan(0);
    expect(missions.some(mission => mission.id === previousMissionId)).toBe(false);
    expect(missions.every(mission => mission.id.startsWith('employee-b-'))).toBe(true);
    expect(missions.every(mission => mission.report.summary === '' && mission.report.photos.length === 0 && mission.incident === '')).toBe(true);
    expect(missions.flatMap(mission => mission.tasks).every(task => task.comment === '' && task.justification === '')).toBe(true);
  });

  it.each(['CLIENT', 'ADMIN'] as const)('purges employee data on a transition to %s without changing client draft behavior', async role => {
    await preparePrivateEmployeeData();
    useAuthStore.getState().setSession(session('another-role', role));
    expect(useEmployeeStore.getState()).toMatchObject({ ownerId: null, missions: [], profile: null, onboarded: false, loading: false });
    expect(useRequestDraftStore.getState().ownerId).toBe(role === 'CLIENT' ? 'another-role' : null);
    await useEmployeeStore.getState().load();
    expect(useEmployeeStore.getState().missions).toEqual([]);
    if (role === 'CLIENT') {
      useRequestDraftStore.getState().updateResidential({ description: 'Brouillon client indépendant' });
      useRequestDraftStore.getState().addPhotos([{ id: 'client-photo', uri: 'file:///client.jpg', name: 'Logement' }]);
      useAuthStore.getState().setSession(session('another-role', 'CLIENT'));
      expect(useRequestDraftStore.getState().residential.description).toBe('Brouillon client indépendant');
      expect(useRequestDraftStore.getState().photos).toHaveLength(1);
      useAuthStore.getState().setSession(session('employee-c'));
      expect(useRequestDraftStore.getState()).toMatchObject({ ownerId: null, photos: [] });
      expect(useRequestDraftStore.getState().residential.description).toBe('');
    }
  });

  it('clears the employee session and both private stores on logout', async () => {
    await preparePrivateEmployeeData();
    useAuthStore.getState().clearSession();
    expect(useAuthStore.getState().session).toBeNull();
    expect(useEmployeeStore.getState()).toMatchObject({ ownerId: null, missions: [], profile: null, onboarded: false, loading: false });
    expect(useRequestDraftStore.getState()).toMatchObject({ ownerId: null, category: null, photos: [] });
    useAuthStore.getState().setSession(session('employee-a'));
    await useEmployeeStore.getState().load();
    expect(useEmployeeStore.getState().onboarded).toBe(false);
    expect(useEmployeeStore.getState().missions[0]?.status).toBe('UPCOMING');
    expect(useEmployeeStore.getState().missions[0]?.report.photos).toEqual([]);
  });

  it('discards a late mission load after switching employees', async () => {
    let resolvePrevious!: (missions: EmployeeMission[]) => void;
    vi.spyOn(employeeService, 'getEmployeeMissions').mockImplementationOnce(() => new Promise(resolve => { resolvePrevious = resolve; }));
    useAuthStore.getState().setSession(session('employee-a'));
    const previousLoad = useEmployeeStore.getState().load();
    expect(useEmployeeStore.getState().loading).toBe(true);
    useAuthStore.getState().setSession(session('employee-b'));
    await useEmployeeStore.getState().load();
    const currentMissions = useEmployeeStore.getState().missions;
    resolvePrevious(employeeService.createDemoEmployeeMissions('employee-a'));
    await previousLoad;
    expect(useEmployeeStore.getState().ownerId).toBe('employee-b');
    expect(useEmployeeStore.getState().missions).toBe(currentMissions);
    expect(useEmployeeStore.getState().missions.every(mission => mission.id.startsWith('employee-b-'))).toBe(true);
  });
});
