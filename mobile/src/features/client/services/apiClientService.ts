import type { ClientServices, NotificationPreferences } from '../types/client';
import type { RequestDto, QuoteDto, AppointmentDto, AddressDto, NotificationDto } from '../../../services/api/dto';
import { request, allPages, ApiError, unavailable } from '../../../services/api/transport';
import { requestFrom, quoteFrom, appointmentFrom, addressFrom, toInstant } from '../../../services/api/mappers';
import { uploadPhoto } from '../../../services/api/uploads';
const getRequest = async (id: string) => requestFrom(await request<RequestDto>('GET', '/requests/' + id));
async function requests() { const rows = await allPages<{ id: string }>('/requests'); return Promise.all(rows.map(r => getRequest(r.id))); }
const getQuote = async (id: string) => { const dto = await request<QuoteDto>('GET', '/quotes/' + id); return quoteFrom(dto, await getRequest(dto.requestId)); };
export const apiClientServices: ClientServices = {
 requests: {
  list: requests, get: (_user, id) => getRequest(id),
  async create(_user, input) {
   if (!input.schedule.addressId) throw new ApiError('Sélectionnez une adresse complète dans Date et préférences.');
   if (input.category !== 'RESIDENTIAL' && input.documents.length) unavailable('Envoi des documents PDF');
   const { photos, submissionKey, schedule } = input;
   const availabilities = schedule.availabilities.map((a, i) => {
    const slots = { MORNING: ['08:00', '12:00'], AFTERNOON: ['12:00', '16:00'], EVENING: ['16:00', '20:00'] };
    const times = a.slot === 'CUSTOM' ? [a.startTime!, a.endTime!] : slots[a.slot as keyof typeof slots];
    return { startAt: toInstant(a.date, times[0]!), endAt: toInstant(a.date, times[1]!), priority: i + 1 };
   });
   const uiDetails = input.category === 'RESIDENTIAL' ? { category: input.category, residential: input.residential, schedule } : { category: input.category, business: input.business, schedule };
   const common = { submissionKey, addressId: schedule.addressId, availabilities, uiDetails };
   const payload = input.category === 'RESIDENTIAL' ? { ...common, requestType: 'RESIDENTIAL', description: input.residential.description, residential: { housingType: input.residential.propertyType, bedrooms: input.residential.bedrooms, bathrooms: input.residential.bathrooms, floors: input.residential.floors, areaSqft: Number(input.residential.areaSqft) || undefined, hasPets: input.residential.hasPets, specialNotes: schedule.instructions } } : { ...common, requestType: 'BUSINESS', description: input.business.description, business: { businessType: input.business.establishmentType, companyName: input.business.companyName, areaSqft: Number(input.business.areaSqft) || undefined, areasToClean: input.business.zones, scopeDescription: input.business.description, frequency: ({ Ponctuel: 'ONE_TIME', Hebdomadaire: 'WEEKLY', Quotidien: 'DAILY', Personnalisé: 'CUSTOM' })[input.business.frequency as 'Ponctuel'], constraints: [input.business.constraints, input.business.equipment, input.business.restrictedAreas, input.business.allowedProducts].filter(Boolean).join('\n') } };
   const dto = await request<RequestDto>('POST', '/requests', payload);
   for (const photo of photos) {
    if (dto.photos.some(p => p.caption === photo.id)) continue;
    const fileKey = await uploadPhoto('REQUEST', dto.id, photo.uri);
    await request('POST', '/requests/' + dto.id + '/photos', { fileKey, caption: photo.id });
   }
   return getRequest(dto.id);
  },
 },
 quotes: {
  async list() { const dossiers = await requests(); const lists = await Promise.all(dossiers.map(async dossier => (await request<QuoteDto[]>('GET', '/requests/' + dossier.id + '/quotes')).map(q => quoteFrom(q, dossier)))); return lists.flat(); },
  get: (_user, id) => getQuote(id),
  async accept(_user, id) { await request('POST', '/quotes/' + id + '/accept'); const appointments = await request<AppointmentDto[]>('GET', '/appointments'); const result = appointments.find(a => a.acceptedQuoteId === id); if (!result) throw new ApiError('Offre acceptée. Actualisez vos réservations pour retrouver le rendez-vous.'); return appointmentFrom(result); },
  async reject(_user, id, reason) { await request('POST', '/quotes/' + id + '/reject', { reason }); },
 },
 reservations: {
  async list() { return (await request<AppointmentDto[]>('GET', '/appointments')).map(appointmentFrom); },
  async get(_user, id) { return appointmentFrom(await request<AppointmentDto>('GET', '/appointments/' + id)); },
  async cancel(_user, id) { await request('POST', '/appointments/' + id + '/client-cancel'); },
 },
 addresses: {
  async list() { return (await request<AddressDto[]>('GET', '/addresses')).map(addressFrom); },
  async save(_user, input, id) { return addressFrom(await request<AddressDto>(id ? 'PATCH' : 'POST', '/addresses' + (id ? '/' + id : ''), { label: input.label, line1: input.street, line2: input.unit, city: input.city, province: input.province, postalCode: input.postalCode, accessNotes: input.accessNotes, isDefault: input.isDefault })); },
  async remove(_user, id) { await request('DELETE', '/addresses/' + id); },
  async setDefault(_user, id) { await request('PATCH', '/addresses/' + id, { isDefault: true }); },
 },
 notifications: {
  async list() { const data = await request<{ items: NotificationDto[] }>('GET', '/notifications'); return data.items.filter(n => n.relatedEntityId && ['REQUEST', 'QUOTE', 'APPOINTMENT'].includes(n.relatedEntityType ?? '')).map(n => ({ id: n.id, title: n.title, text: n.body, read: !!n.readAt, createdAt: n.createdAt, target: { kind: n.relatedEntityType === 'QUOTE' ? 'quote' as const : n.relatedEntityType === 'APPOINTMENT' ? 'reservation' as const : 'request' as const, id: n.relatedEntityId! } })); },
  async markRead(_user, id) { await request('POST', id ? '/notifications/' + id + '/read' : '/notifications/read-all'); },
  preferences: () => request<NotificationPreferences>('GET', '/preferences'),
  savePreferences: (_user, input) => request<NotificationPreferences>('PUT', '/preferences', input),
 },
 support: { send: (_user, input) => request<{ reference: string }>('POST', '/support', input) },
};
