import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDemoEmployeeMissions } from './mockEmployeeService';
import { formatDuration, getClosureErrors, getElapsedMs, getProgress, getReportErrors } from './missionRules';

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-07T14:00:00Z')); });
afterEach(() => vi.useRealTimers());

describe('mission rules and demo consistency', () => {
  it('loads fresh realistic missions with coherent upcoming and running timestamps', () => {
    const missions = createDemoEmployeeMissions('a');
    expect(missions).toHaveLength(3);
    expect(missions.filter(item => item.status === 'UPCOMING').every(item => Date.parse(item.scheduledStart) > Date.now())).toBe(true);
    const running = missions.find(item => item.status === 'IN_PROGRESS')!;
    expect(getElapsedMs(running)).toBe(35 * 60000);
    missions[0]!.tasks[0]!.status = 'DONE';
    expect(createDemoEmployeeMissions('b')[0]!.tasks[0]!.status).toBe('TODO');
  });

  it('calculates resolved progress with valid exceptions and tolerates an empty checklist', () => {
    const mission = createDemoEmployeeMissions('a')[0]!;
    mission.tasks = mission.tasks.slice(0, 2);
    mission.tasks[0]!.status = 'DONE';
    Object.assign(mission.tasks[1]!, { status: 'NOT_APPLICABLE', allowNotApplicable: true, justification: '' });
    expect(getProgress(mission)).toEqual({ done: 1, total: 2, notApplicable: 0, remaining: 1, percent: 50 });
    mission.tasks[1]!.justification = 'Zone inaccessible.';
    expect(getProgress(mission)).toEqual({ done: 1, total: 2, notApplicable: 1, remaining: 0, percent: 100 });
    mission.tasks = [];
    expect(getProgress(mission)).toEqual({ done: 0, total: 0, notApplicable: 0, remaining: 0, percent: 0 });
  });

  it('rejects inconsistent timings and forbidden exceptions even in malformed persisted data', () => {
    const mission = createDemoEmployeeMissions('a')[1]!;
    mission.tasks.forEach(task => { task.status = 'DONE'; });
    expect(getClosureErrors(mission)).toEqual({});
    mission.tasks[0]!.status = 'NOT_APPLICABLE';
    mission.tasks[0]!.justification = 'Raison';
    expect(getClosureErrors(mission)).toHaveProperty(mission.tasks[0]!.id);
    mission.startedAt = 'invalid';
    expect(getClosureErrors(mission)).toHaveProperty('timing');
    mission.status = 'REPORT_PENDING';
    mission.report.summary = 'Les tâches ont été réalisées.';
    mission.startedAt = new Date(Date.now()).toISOString();
    mission.endedAt = new Date(Date.now() - 60000).toISOString();
    expect(getReportErrors(mission)).toHaveProperty('timing');
  });

  it('formats elapsed duration safely and freezes it at the recorded end', () => {
    const mission = createDemoEmployeeMissions('a')[1]!;
    expect(formatDuration(125 * 60000)).toBe('2 h 05 min');
    expect(formatDuration(-1)).toBe('0 h 00 min');
    expect(formatDuration(Number.NaN)).toBe('0 h 00 min');
    mission.endedAt = new Date(Date.now()).toISOString();
    expect(getElapsedMs(mission, Date.now() + 60000)).toBe(35 * 60000);
    mission.startedAt = 'invalid';
    expect(getElapsedMs(mission)).toBe(0);
  });
});
