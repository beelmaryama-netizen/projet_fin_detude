import type { ClientAddress, ClientNotification, ClientQuote, ClientRequest, NotificationPreferences } from '../types/client';
import type { ClientReservation } from '../types/reservation';
import { addressLabel } from './clientFormatters';
export interface ClientDatabase {
  requests: ClientRequest[]; quotes: ClientQuote[]; reservations: ClientReservation[];
  addresses: ClientAddress[]; notifications: ClientNotification[]; preferences: NotificationPreferences;
  submissions: Record<string, string>;
}
export function createClientFixtures(demo: boolean, now: number): ClientDatabase {
  const db: ClientDatabase = { requests: [], quotes: [], reservations: [], addresses: [], notifications: [], submissions: {}, preferences: { newQuotes: true, bookingConfirmations: true, bookingChanges: true, reminders: true } };
  if (!demo) return db;
  const date = (days: number, hour = 16) => { const d = new Date(now + days * 86_400_000); d.setUTCHours(hour, 0, 0, 0); return d.toISOString(); };
  const address: ClientAddress = { id: 'adr-demo', label: 'Maison', street: '123 rue Sainte-Catherine', unit: '4', city: 'Montréal', province: 'QC', postalCode: 'H2X 1Y4', accessNotes: 'Sonner à l’arrivée.', isDefault: true };
  db.addresses.push(address);
  const scenarios = [
    { key: 'offer', status: 'QUOTED', days: 7 }, { key: 'confirmed', status: 'ACCEPTED', days: 3 },
    { key: 'completed', status: 'CLOSED', days: -12 }, { key: 'cancelled', status: 'CANCELLED', days: 5 }, { key: 'expired', status: 'IN_REVIEW', days: 9 },
  ] as const;
  for (const scenario of scenarios) {
    const request: ClientRequest = { id: `DEM-${scenario.key}`, category: 'RESIDENTIAL', serviceTitle: 'Grand ménage résidentiel', status: scenario.status, createdAt: date(-20),
      residential: { propertyType: 'CONDO', bedrooms: 2, bathrooms: 1, floors: 1, areaSqft: '950', hasPets: false, description: 'Entretien de la cuisine, des salles de bain et des planchers.' },
      photos: [], schedule: { availabilities: [{ date: date(scenario.days).slice(0, 10), slot: 'AFTERNOON' }], instructions: 'Utiliser des produits doux sur les planchers.', accessNotes: address.accessNotes, addressId: address.id }, address: { ...address },
      history: [{ at: date(-20), label: 'Demande reçue' }, { at: date(-19), label: 'Demande analysée' }] };
    const quote: ClientQuote = { id: `OFF-${scenario.key}`, requestId: request.id, serviceTitle: request.serviceTitle, address: addressLabel(address),
      status: scenario.key === 'offer' ? 'PENDING' : scenario.key === 'expired' ? 'EXPIRED' : 'ACCEPTED', durationHours: 4, startAt: date(scenario.days), endAt: date(scenario.days, 20), expiresAt: date(scenario.key === 'expired' ? -1 : 4),
      lines: [{ label: 'Grand ménage résidentiel · 4 h', cents: 22000 }, { label: 'Déplacement inclus', cents: 0 }], taxes: [{ label: 'TPS — montant de démonstration', cents: 1100 }, { label: 'TVQ — montant de démonstration', cents: 2195 }], totalCents: 25295,
      adminNote: 'Produits et matériel inclus. Le rendez-vous sera confirmé par notre équipe après votre acceptation.' };
    request.history.push({ at: date(-18), label: 'Offre transmise' }); db.requests.push(request); db.quotes.push(quote);
    if (scenario.key !== 'offer' && scenario.key !== 'expired') {
      const status = scenario.key === 'confirmed' ? 'CONFIRMED' : scenario.key === 'completed' ? 'COMPLETED' : 'CANCELLED';
      db.reservations.push({ id: `RES-${scenario.key}`, requestId: request.id, quoteId: quote.id, serviceTitle: request.serviceTitle, status, startAt: quote.startAt, endAt: quote.endAt,
        timeZone: 'America/Toronto', address: quote.address, instructions: request.schedule.instructions, summary: request.residential.description, cancellationDeadline: new Date(Date.parse(quote.startAt) - 86_400_000).toISOString() });
      request.history.push({ at: date(-17), label: 'Offre acceptée' });
    }
  }
  db.notifications.push(
    { id: 'not-offer', title: 'Une offre est disponible', text: 'Consultez votre offre de grand ménage résidentiel.', createdAt: date(-1), read: false, target: { kind: 'quote', id: 'OFF-offer' } },
    { id: 'not-confirmed', title: 'Réservation confirmée', text: 'Votre prochain rendez-vous a été confirmé.', createdAt: date(-2), read: false, target: { kind: 'reservation', id: 'RES-confirmed' } },
  );
  return db;
}
