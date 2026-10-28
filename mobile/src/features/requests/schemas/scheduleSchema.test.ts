import { describe, it, expect } from 'vitest';
import { scheduleSchema } from './scheduleSchema';
import { emptySchedule } from '../types/request';
describe('schedule validation', () => {
  const valid = { ...emptySchedule(), availabilities: [{ date: '2099-02-28', slot: 'MORNING' }] };
  it('accepts one or two future distinct preferences', () => {
    expect(scheduleSchema.safeParse(valid).success).toBe(true);
    expect(scheduleSchema.safeParse({ ...valid, availabilities: [...valid.availabilities, { date: '2099-02-28', slot: 'EVENING' }] }).success).toBe(true);
  });
  it('rejects missing, impossible, past, duplicate and excessive dates', () => {
    for (const availabilities of [[], [{ date: '2099-02-30', slot: 'MORNING' }], [{ date: '2000-01-01', slot: 'MORNING' }], [{ date: '2099-02-28', slot: '' }], [...valid.availabilities, ...valid.availabilities], Array(3).fill(valid.availabilities[0])]) expect(scheduleSchema.safeParse({ ...valid, availabilities }).success).toBe(false);
  });
});
