import { categoryTitle } from '../../requests/data/requestCategories';
import type { User } from '../../../types/identity';
import type { ClientServices, ClientNotification } from '../types/client';
import { ClientServiceError } from '../types/client';
import { createClientFixtures, type ClientDatabase } from './clientFixtures';
import { addressSchema, preferencesSchema, supportSchema } from '../schemas/clientSchemas';
import { requestSubmissionSchema } from '../../requests/schemas/scheduleSchema';
import { canCancelReservation, effectiveQuoteStatus } from './clientFormatters';
interface Options { latency?: number; now?: () => number; fail?: () => 'NETWORK' | 'SERVER' | undefined }
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
/** In-memory per-account simulator. No HTTP requests. */
export function createMockClientServices(options: Options = {}): ClientServices {
  const databases = new Map<string, ClientDatabase>();
  const now = options.now ?? Date.now;
  let sequence = 0;
  const id = (prefix: string) => `${prefix}-${now().toString(36).toUpperCase()}-${++sequence}`;
  async function database(user: User) {
    await new Promise<void>(resolve => setTimeout(resolve, options.latency ?? 450));
    const failure = options.fail?.();
    if (failure) throw new ClientServiceError(failure, failure === 'NETWORK' ? 'Connexion interrompue. Réessayez.' : 'Le service est indisponible. Réessayez dans un instant.');
    if (user.role !== 'CLIENT') throw new ClientServiceError('NOT_FOUND', 'Cet espace est réservé aux clients.');
    let db = databases.get(user.id);
    if (!db) { db = createClientFixtures(user.email.endsWith('@magicpro.demo'), now()); databases.set(user.id, db); }
    for (const quote of db.quotes) {
      if (quote.status === 'PENDING' && effectiveQuoteStatus(quote, now()) === 'EXPIRED') {
        quote.status = 'EXPIRED';
        const request = db.requests.find(item => item.id === quote.requestId);
        if (request?.status === 'QUOTED') { request.status = 'IN_REVIEW'; request.history.push({ at: new Date(now()).toISOString(), label: 'Offre expirée' }); }
      }
    }
    return db;
  }
  function find<T extends { id: string }>(items: T[], key: string): T {
    const item = items.find(value => value.id === key);
    if (!item) throw new ClientServiceError('NOT_FOUND', 'Cet élément n’est plus disponible.');
    return item;
  }
  const notify = (db: ClientDatabase, title: string, text: string, target: ClientNotification['target']) => db.notifications.unshift({ id: id('NOT'), title, text, target, read: false, createdAt: new Date(now()).toISOString() });
  return {
    requests: {
      list: async user => copy((await database(user)).requests), get: async (user, key) => copy(find((await database(user)).requests, key)),
      create: async (user, input) => {
        const db = await database(user); const existingId = db.submissions[input.submissionKey];
        if (existingId) return copy(find(db.requests, existingId));
        const parsed = requestSubmissionSchema.safeParse(input);
        if (!parsed.success) throw new ClientServiceError('VALIDATION', 'Vérifiez les détails et les disponibilités de votre demande.');
        const address = parsed.data.category === 'RESIDENTIAL' && input.schedule.addressId ? find(db.addresses, input.schedule.addressId) : null;
        const at = new Date(now()).toISOString();
        const request = { id: id('DEM'), ...copy(parsed.data), serviceTitle: `Entretien · ${categoryTitle(parsed.data.category)}`, status: 'NEW' as const, createdAt: at, photos: copy(input.photos), schedule: copy(parsed.data.schedule), address: copy(address), history: [{ at, label: 'Demande reçue' }] };
        db.requests.unshift(request); db.submissions[input.submissionKey] = request.id;
        notify(db, 'Demande reçue', 'Votre demande sera analysée par l’équipe MagicPro.', { kind: 'request', id: request.id });
        return copy(request);
      },
    },
    quotes: {
      list: async user => copy((await database(user)).quotes), get: async (user, key) => copy(find((await database(user)).quotes, key)),
      accept: async (user, key) => {
        const db = await database(user); const quote = find(db.quotes, key); const existing = db.reservations.find(item => item.quoteId === key);
        if (quote.status === 'ACCEPTED' && existing) return copy(existing);
        if (quote.status !== 'PENDING' || Date.parse(quote.startAt) <= now()) throw new ClientServiceError('CONFLICT', 'Cette offre ne peut plus être acceptée. Actualisez le dossier.');
        const request = find(db.requests, quote.requestId);
        if (request.status !== 'QUOTED') throw new ClientServiceError('CONFLICT', 'La demande a changé. Actualisez le dossier.');
        quote.status = 'ACCEPTED'; request.status = 'ACCEPTED'; request.history.push({ at: new Date(now()).toISOString(), label: 'Offre acceptée — horaire à confirmer' });
        const reservation = { id: id('RES'), requestId: request.id, quoteId: quote.id, serviceTitle: quote.serviceTitle, status: 'PENDING' as const, startAt: quote.startAt, endAt: quote.endAt, timeZone: 'America/Toronto', address: quote.address,
          instructions: [request.schedule.instructions, request.schedule.accessNotes].filter(Boolean).join('\n'), summary: request.category === 'RESIDENTIAL' ? request.residential.description : request.business.description, cancellationDeadline: new Date(Date.parse(quote.startAt) - 86_400_000).toISOString() };
        db.reservations.unshift(reservation); notify(db, 'Offre acceptée', 'Votre rendez-vous est en attente de confirmation.', { kind: 'reservation', id: reservation.id }); return copy(reservation);
      },
      reject: async (user, key, reason) => {
        const db = await database(user); const quote = find(db.quotes, key);
        if (quote.status !== 'PENDING') throw new ClientServiceError('CONFLICT', 'Cette offre ne peut plus être refusée.');
        if (reason.length > 500) throw new ClientServiceError('VALIDATION', 'Le motif est limité à 500 caractères.');
        quote.status = 'REJECTED'; quote.rejectionReason = reason.trim();
        const request = find(db.requests, quote.requestId); request.status = 'IN_REVIEW'; request.history.push({ at: new Date(now()).toISOString(), label: 'Offre refusée — demande conservée pour réanalyse' });
      },
    },
    reservations: {
      list: async user => copy((await database(user)).reservations), get: async (user, key) => copy(find((await database(user)).reservations, key)),
      cancel: async (user, key) => {
        const db = await database(user); const reservation = find(db.reservations, key);
        if (!canCancelReservation(reservation, now())) throw new ClientServiceError('CONFLICT', 'Le délai d’annulation est dépassé ou ce rendez-vous est déjà clôturé. Contactez le support.');
        reservation.status = 'CANCELLED'; const request = find(db.requests, reservation.requestId); request.status = 'CANCELLED';
        request.history.push({ at: new Date(now()).toISOString(), label: 'Réservation annulée par le client' }); notify(db, 'Réservation annulée', 'Votre annulation a été enregistrée.', { kind: 'reservation', id: key });
      },
    },
    addresses: {
      list: async user => copy((await database(user)).addresses),
      save: async (user, input, key) => {
        const db = await database(user); const parsed = addressSchema.parse(input); const previous = key ? find(db.addresses, key) : undefined;
        const isDefault = parsed.isDefault || db.addresses.length === 0 || previous?.isDefault === true;
        const address = { ...parsed, id: previous?.id ?? id('ADR'), isDefault };
        if (isDefault) db.addresses.forEach(item => { item.isDefault = false; });
        if (previous) db.addresses[db.addresses.indexOf(previous)] = address; else db.addresses.push(address); return copy(address);
      },
      remove: async (user, key) => { const db = await database(user); const address = find(db.addresses, key); db.addresses = db.addresses.filter(item => item.id !== key); if (address.isDefault && db.addresses[0]) db.addresses[0].isDefault = true; },
      setDefault: async (user, key) => { const db = await database(user); find(db.addresses, key); db.addresses.forEach(item => { item.isDefault = item.id === key; }); },
    },
    notifications: {
      list: async user => copy((await database(user)).notifications),
      markRead: async (user, key) => { const db = await database(user); if (key) find(db.notifications, key).read = true; else db.notifications.forEach(item => { item.read = true; }); },
      preferences: async user => copy((await database(user)).preferences),
      savePreferences: async (user, preferences) => { const db = await database(user); db.preferences = preferencesSchema.parse(preferences); return copy(db.preferences); },
    },
    support: { send: async (user, input) => { await database(user); supportSchema.parse(input); return { reference: id('SUP') }; } },
  };
}
