import { describe, expect, it } from 'vitest';
import { localDateKey, preferenceSchema } from './preferenceSchema';

const now = new Date(2026, 9, 7, 23, 59);
const valid = { date: '2026-10-07', timeSlot: 'MORNING', notes: '' };
describe('request preferences', () => {
  it('accepts today in the local calendar and future dates', () => {
    expect(localDateKey(now)).toBe('2026-10-07');
    expect(preferenceSchema(now).safeParse(valid).success).toBe(true);
    expect(preferenceSchema(now).safeParse({ ...valid, date: '2027-01-01' }).success).toBe(true);
  });
  it.each(['2026-10-06', '2027-02-29', '2026-13-01', '2026-04-31', '07/10/2026', ''])('rejects past or invalid date %s', date => {
    expect(preferenceSchema(now).safeParse({ ...valid, date }).success).toBe(false);
  });
  it('requires a time slot and limits optional notes', () => {
    expect(preferenceSchema(now).safeParse({ ...valid, timeSlot: '' }).success).toBe(false);
    expect(preferenceSchema(now).safeParse({ ...valid, notes: 'a'.repeat(501) }).success).toBe(false);
  });
});
