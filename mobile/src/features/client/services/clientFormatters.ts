import type { ClientAddress, ClientQuote, RequestStatus, QuoteStatus } from '../types/client';
import type { ClientReservation } from '../types/reservation';
import type { TimeSlot } from '../../requests/types/request';
export const requestStatusLabels: Record<RequestStatus, string> = { NEW: 'Nouvelle', IN_REVIEW: 'En analyse', QUOTED: 'Offre disponible', ACCEPTED: 'Acceptée', CANCELLED: 'Annulée', CLOSED: 'Fermée' };
export const quoteStatusLabels: Record<QuoteStatus, string> = { PENDING: 'En attente', ACCEPTED: 'Acceptée', REJECTED: 'Refusée', EXPIRED: 'Expirée' };
export const reservationStatusLabels: Record<ClientReservation['status'], string> = { PENDING: 'En attente de confirmation', CONFIRMED: 'Confirmée', COMPLETED: 'Terminée', CANCELLED: 'Annulée' };
export const slotLabels: Record<TimeSlot, string> = { MORNING: '8 h 00 – 12 h 00', AFTERNOON: '12 h 00 – 16 h 00', EVENING: '16 h 00 – 20 h 00' };
export const propertyLabels = { APARTMENT: 'Appartement', CONDO: 'Condo', HOUSE: 'Maison', '': 'Non précisé' };
export const addressLabel = (address: ClientAddress | null) => address ? `${address.street}${address.unit ? `, unité ${address.unit}` : ''}, ${address.city}, ${address.province} ${address.postalCode}` : 'Adresse à préciser';
export const money = (cents: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100);
export const dateLabel = (value: string) => new Intl.DateTimeFormat('fr-CA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Toronto' }).format(new Date(value.length === 10 ? `${value}T16:00:00Z` : value));
export const todayLocal = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
export const effectiveQuoteStatus = (quote: ClientQuote, now = Date.now()): QuoteStatus => quote.status === 'PENDING' && Date.parse(quote.expiresAt) <= now ? 'EXPIRED' : quote.status;
export const canCancelReservation = (reservation: ClientReservation, now = Date.now()) => (reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') && now < Date.parse(reservation.cancellationDeadline);
export const reservationGroup = (reservation: ClientReservation, now = Date.now()) => reservation.status === 'CANCELLED' ? 'cancelled' : reservation.status === 'COMPLETED' || Date.parse(reservation.endAt) <= now ? 'past' : 'upcoming';
export function formatReservation(reservation: Pick<ClientReservation, 'startAt' | 'endAt' | 'timeZone'>) {
  const time = new Intl.DateTimeFormat('fr-CA', { hour: '2-digit', minute: '2-digit', timeZone: reservation.timeZone });
  return { date: dateLabel(reservation.startAt), time: `${time.format(new Date(reservation.startAt))} – ${time.format(new Date(reservation.endAt))}` };
}
