import { withinHours } from '../src/utils/availability.js';
test('Toronto availability follows daylight saving time and rejects other days and cross-day slots', () => {
 const hours = { days: [1], start: '08:00', end: '17:00' };
 expect(withinHours(hours, '2026-11-09T13:00:00Z', '2026-11-09T22:00:00Z')).toBe(true);
 expect(withinHours(hours, '2026-07-06T12:00:00Z', '2026-07-06T21:00:00Z')).toBe(true);
 expect(withinHours(hours, '2026-11-09T12:00:00Z', '2026-11-09T22:00:00Z')).toBe(false);
 expect(withinHours(hours, '2026-11-10T13:00:00Z', '2026-11-10T22:00:00Z')).toBe(false);
 expect(withinHours(hours, '2026-11-09T13:00:00Z', '2026-11-10T14:00:00Z')).toBe(false);
});
