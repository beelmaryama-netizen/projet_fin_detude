import { describe, it, expect } from 'vitest';
import { addressFrom, appointmentFrom, toInstant, torontoParts } from './mappers';
import { formatReservation } from '../../features/client/services/clientFormatters';
describe('API mapping', () => {
 it('keeps Toronto hours across daylight saving offsets', () => {
  expect(toInstant('2026-07-10','09:00')).toBe('2026-07-10T13:00:00.000Z');
  expect(toInstant('2026-12-10','09:00')).toBe('2026-12-10T14:00:00.000Z');
  expect(torontoParts('2026-12-10T14:00:00Z')).toEqual({ date: '2026-12-10', time: '09:00' });
 });
 it('maps default addresses and renders an unscheduled reservation safely', () => {
  const address = { id: 'a', label: 'Maison', line1: '123 Test', city: 'Montréal', province: 'QC', postalCode: 'H2X 3K2', isDefault: true };
  expect(addressFrom(address).isDefault).toBe(true);
  const reservation = appointmentFrom({ id: 'b', requestId: 'r', acceptedQuoteId: 'q', status: 'PENDING_CONFIRMATION', request: { id: 'r', requestType: 'RESIDENTIAL', address } });
  expect(reservation.status).toBe('PENDING'); expect(formatReservation(reservation)).toEqual({ date: 'Date à confirmer', time: 'Horaire à confirmer' });
 });
});
