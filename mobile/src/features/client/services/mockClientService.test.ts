import { describe, expect, it } from 'vitest';
import { createMockClientServices } from './mockClientService';
import { canCancelReservation, reservationGroup } from './clientFormatters';
import type { User } from '../../../types/identity';
import type { RequestSubmission } from '../../requests/types/request';
const user: User = { id: 'client-a', role: 'CLIENT', firstName: 'Léa', lastName: 'Test', email: 'client@magicpro.demo' };
const fresh: User = { ...user, id: 'new-client', email: 'lea@example.ca' };
const now = Date.parse('2030-01-10T12:00:00Z');
const create = () => createMockClientServices({ latency: 0, now: () => now });
const submission: RequestSubmission = { category: 'RESIDENTIAL', submissionKey: 'unique-draft', residential: { propertyType: 'HOUSE', bedrooms: 2, bathrooms: 1, floors: 1, areaSqft: '1200', hasPets: false, description: 'Cuisine et planchers' }, photos: [], schedule: { availabilities: [{ date: '2099-01-01', slot: 'MORNING' }], instructions: '', accessNotes: '', addressId: '' } };
describe('client lifecycle mock', () => {
  it('creates a request only, deduplicates concurrent sends and emits one notification', async () => {
    const api = create();
    const [a, b] = await Promise.all([api.requests.create(fresh, submission), api.requests.create(fresh, submission)]);
    expect(a.id).toBe(b.id); expect(a.status).toBe('NEW');
    expect(await api.requests.list(fresh)).toHaveLength(1); expect(await api.quotes.list(fresh)).toEqual([]); expect(await api.reservations.list(fresh)).toEqual([]);
    expect(await api.notifications.list(fresh)).toHaveLength(1);
  });
  it('accepts once, creates only a pending booking and preserves the price', async () => {
    const api = create();
    const [a, b] = await Promise.all([api.quotes.accept(user, 'OFF-offer'), api.quotes.accept(user, 'OFF-offer')]);
    expect(a.id).toBe(b.id); expect(a.status).toBe('PENDING');
    expect((await api.requests.get(user, 'DEM-offer')).status).toBe('ACCEPTED');
    const quote = await api.quotes.get(user, 'OFF-offer'); expect(quote.status).toBe('ACCEPTED');
    expect(quote.totalCents).toBe([...quote.lines, ...quote.taxes].reduce((sum, line) => sum + line.cents, 0));
    expect((await api.reservations.list(user)).filter(item => item.quoteId === 'OFF-offer')).toHaveLength(1);
  });
  it('rejects an offer without deleting the request or creating a booking', async () => {
    const api = create(); await api.quotes.reject(user, 'OFF-offer', 'Autre horaire souhaité');
    expect((await api.quotes.get(user, 'OFF-offer')).status).toBe('REJECTED');
    expect((await api.requests.get(user, 'DEM-offer')).status).toBe('IN_REVIEW');
    expect((await api.reservations.list(user)).some(item => item.quoteId === 'OFF-offer')).toBe(false);
    await expect(api.quotes.accept(user, 'OFF-offer')).rejects.toMatchObject({ code: 'CONFLICT' });
  });
  it('rejects expired offers and rechecks expiry at action time', async () => {
    let clock = now; const api = createMockClientServices({ latency: 0, now: () => clock });
    await api.quotes.list(user); clock += 6 * 86_400_000;
    await expect(api.quotes.accept(user, 'OFF-offer')).rejects.toMatchObject({ code: 'CONFLICT' });
    expect((await api.requests.get(user, 'DEM-offer')).status).toBe('IN_REVIEW');
    await expect(api.quotes.accept(user, 'OFF-expired')).rejects.toMatchObject({ code: 'CONFLICT' });
  });
  it('enforces cancellation boundaries and updates all linked data', async () => {
    let clock = now; const api = createMockClientServices({ latency: 0, now: () => clock });
    const booking = await api.reservations.get(user, 'RES-confirmed');
    expect(canCancelReservation(booking, Date.parse(booking.cancellationDeadline) - 1)).toBe(true);
    expect(canCancelReservation(booking, Date.parse(booking.cancellationDeadline))).toBe(false);
    await api.reservations.cancel(user, booking.id);
    expect((await api.requests.get(user, booking.requestId)).status).toBe('CANCELLED');
    expect(reservationGroup(await api.reservations.get(user, booking.id), clock)).toBe('cancelled');
    await expect(api.reservations.cancel(user, 'RES-completed')).rejects.toMatchObject({ code: 'CONFLICT' });
    const pending = await api.quotes.accept(user, 'OFF-offer'); clock = Date.parse(pending.cancellationDeadline);
    await expect(api.reservations.cancel(user, pending.id)).rejects.toMatchObject({ code: 'CONFLICT' });
  });
  it('isolates accounts and does not leak mutable fixture references', async () => {
    const api = create(); const request = await api.requests.create(fresh, submission);
    await expect(api.requests.get(user, request.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    const list = await api.requests.list(fresh); const first = list[0]!; if (first.category === 'RESIDENTIAL') first.residential.description = 'changed outside service';
    expect(await api.requests.get(fresh, request.id)).toMatchObject({ residential: { description: submission.residential.description } });
    await expect(api.requests.list({ ...fresh, role: 'EMPLOYEE' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
  it('keeps address snapshots and exactly one default address', async () => {
    const api = create(); const initial = (await api.addresses.list(user))[0]!;
    const request = await api.requests.create(user, { ...submission, schedule: { ...submission.schedule, addressId: initial.id } });
    const other = await api.addresses.save(user, { ...initial, street: '456 avenue Exemple', label: 'Travail', isDefault: false });
    await api.addresses.setDefault(user, other.id);
    expect((await api.addresses.list(user)).filter(item => item.isDefault)).toHaveLength(1);
    await api.addresses.remove(user, other.id);
    expect((await api.addresses.list(user))[0]!.isDefault).toBe(true);
    await api.addresses.remove(user, initial.id);
    expect((await api.requests.get(user, request.id)).address?.street).toBe(initial.street);
    await expect(api.requests.create(user, { ...submission, submissionKey: 'new-key', schedule: { ...submission.schedule, addressId: initial.id } })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
  it('persists read status/preferences within the account and can retry network failures', async () => {
    let fail = true; const api = createMockClientServices({ latency: 0, fail: () => fail ? 'NETWORK' : undefined });
    await expect(api.notifications.list(user)).rejects.toMatchObject({ code: 'NETWORK' }); fail = false;
    expect((await api.notifications.list(user)).some(item => !item.read)).toBe(true);
    await api.notifications.markRead(user); expect((await api.notifications.list(user)).every(item => item.read)).toBe(true);
    const preferences = await api.notifications.preferences(user);
    await api.notifications.savePreferences(user, { ...preferences, reminders: false });
    expect((await api.notifications.preferences(user)).reminders).toBe(false);
    expect((await api.notifications.preferences(fresh)).reminders).toBe(true);
  });
  it('rejects invalid submissions before adding any data', async () => {
    const api = create(); await expect(api.requests.create(fresh, { ...submission, schedule: { ...submission.schedule, availabilities: [] } })).rejects.toMatchObject({ code: 'VALIDATION' });
    expect(await api.requests.list(fresh)).toHaveLength(0);
  });
});
