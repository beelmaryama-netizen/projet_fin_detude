import type { ClientReservation } from '../types/reservation';

export const MOCK_RESERVATION_ID = 'demo-reservation';

/** Relative dates keep the fixture in the upcoming section, without storing real bookings. */
export function getUpcomingReservations(clientId: string, now = new Date()): ClientReservation[] {
  if (!clientId) return [];
  const start = new Date(now.getTime() + 3 * 24 * 60 * 60_000);
  start.setUTCHours(16, 0, 0, 0);
  return [{ id: MOCK_RESERVATION_ID, status: 'CONFIRMED', startAt: start.toISOString(),
    endAt: new Date(start.getTime() + 3 * 60 * 60_000).toISOString(), timeZone: 'America/Toronto',
    serviceTitle: 'Grand ménage résidentiel', address: '123 rue Sainte-Catherine, Montréal, QC' }];
}
export function formatReservation(reservation: ClientReservation) {
  const time = new Intl.DateTimeFormat('fr-CA', { hour: '2-digit', minute: '2-digit', timeZone: reservation.timeZone });
  return {
    date: new Intl.DateTimeFormat('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: reservation.timeZone }).format(new Date(reservation.startAt)),
    time: `${time.format(new Date(reservation.startAt))} – ${time.format(new Date(reservation.endAt))}`,
  };
}
