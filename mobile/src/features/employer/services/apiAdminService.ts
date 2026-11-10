import { create } from 'zustand';
import { apiMode } from '../../../services/api/config';
import { request, allPages, ApiError, unavailable } from '../../../services/api/transport';
import { requestFrom, missionFrom, torontoParts, toInstant, addressText } from '../../../services/api/mappers';
import type { RequestDto, QuoteDto, MissionDto, UserDto, AppointmentDto } from '../../../services/api/dto';
import { useAdminStore, enableSharedWorkspace } from '../store/adminStore';
import { useAuthStore } from '../../../store/authStore';
import type { AdminData, AdminOffer, AdminEmployee, AdminMission, AdminResult, EstimateInput, EmployeeInput, AdminSettings, AdminService } from '../types/admin';
import { useSupportStore, type SupportTicket } from '../../../store/supportStore';
export const useAdminApiStatus = create<{ busy: boolean; error?: string }>(() => ({ busy: false }));
const employeesFrom = (u: UserDto): AdminEmployee => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone ?? '', active: u.status === 'ACTIVE', createdAt: u.createdAt, activationPending: u.mustChangePassword ?? false, city: u.employeeDetails?.city ?? '', specialties: u.employeeDetails?.specialties ?? [], availability: u.employeeDetails?.availability ?? '', workingHours: u.employeeDetails?.workingHours });
function offerFrom(q: QuoteDto): AdminOffer { const s: Record<string, AdminOffer['status']> = { DRAFT: 'draft', SENT: 'sent', ACCEPTED: 'accepted', REJECTED: 'refused', EXPIRED: 'expired', SUPERSEDED: 'cancelled' }; return { id: q.id, requestId: q.requestId, status: s[q.status] ?? 'cancelled', durationHours: (q.estimatedMinutes ?? 0) / 60, employeeCount: q.employeesNeeded ?? 1, subtotalCents: Math.round(Number(q.subtotal) * 100), taxCents: Math.round(Number(q.taxes) * 100), totalCents: Math.round(Number(q.total) * 100), taxPercent: 14.975, date: torontoParts(q.proposedStart ?? '').date, startTime: torontoParts(q.proposedStart ?? '').time, endTime: torontoParts(q.proposedEnd ?? '').time, validityHours: q.validityHours ?? 48, notes: q.notes ?? '', createdAt: q.sentAt ?? '', sentAt: q.sentAt ?? undefined, validUntil: q.expiresAt ?? undefined, requiresBeforePhotos: q.requiresBeforePhotos, requiresAfterPhotos: q.requiresAfterPhotos }; }
let appointmentIds = new Map<string, string>();
export function clearApiAdmin() { enableSharedWorkspace(); useAdminStore.setState({ ownerId: null, requests: [], employees: [], clients: [], offers: [], missions: [], services: [], audit: [] }); useSupportStore.setState({ tickets: [] }); appointmentIds.clear(); }
export async function loadAdminData() {
 const owner = useAuthStore.getState().session?.user;
 if (owner?.role !== 'ADMIN') return;
 const [rows, users, appointments, missions, settings, tickets] = await Promise.all([
  allPages<{ id: string }>('/requests'), request<UserDto[]>('GET', '/users'), request<AppointmentDto[]>('GET', '/appointments'), request<MissionDto[]>('GET', '/missions'), request<AdminSettings>('GET', '/admin/settings'), request<SupportTicket[]>('GET', '/support'),
 ]);
 const requests = await Promise.all(rows.map(r => request<RequestDto>('GET', '/requests/' + r.id)));
 const offers = (await Promise.all(rows.map(r => request<QuoteDto[]>('GET', '/requests/' + r.id + '/quotes')))).flat();
 if (useAuthStore.getState().session?.user.id !== owner.id) return;
 const status: Record<string, AdminMission['status']> = { TO_ASSIGN: 'unassigned', PLANNED: 'planned', IN_PROGRESS: 'in-progress', COMPLETED: 'completed', CANCELLED: 'cancelled' };
 appointmentIds = new Map();
 const mappedMissions: AdminMission[] = missions.map(m => { appointmentIds.set(m.id, m.appointmentId); const employee = missionFrom(m); return { id: m.id, requestId: m.appointment.request.id, offerId: m.appointment.acceptedQuoteId, employeeIds: m.assignments.map(a => a.employee.id), date: torontoParts(employee.startAt).date, startTime: torontoParts(employee.startAt).time, endTime: torontoParts(employee.endAt).time, status: status[m.status] ?? 'unassigned', notes: employee.instructions, checklist: employee.checklist.map(c => ({ ...c, completed: c.isDone })), photos: employee.photos, report: employee.report, incident: employee.incident, startedAt: employee.startedAt, completedAt: employee.completedAt, requiresBeforePhotos: employee.requiresBeforePhotos, requiresAfterPhotos: employee.requiresAfterPhotos }; });
 for (const a of appointments) if (!missions.some(m => m.appointmentId === a.id) && ['PENDING_CONFIRMATION', 'CONFIRMED'].includes(a.status)) { const id = 'appointment:' + a.id; appointmentIds.set(id, a.id); mappedMissions.push({ id, requestId: a.requestId, offerId: a.acceptedQuoteId, date: torontoParts(a.scheduledStart ?? '').date, startTime: torontoParts(a.scheduledStart ?? '').time, endTime: torontoParts(a.scheduledEnd ?? '').time, status: 'unassigned', notes: '', checklist: [], employeeIds: [] }); }
 const data: AdminData = {
  requests: requests.map(r => { const dossier = requestFrom(r); return { id: r.id, clientId: r.clientId, dossier, clientName: r.client ? r.client.firstName + ' ' + r.client.lastName : '', serviceType: dossier.serviceTitle, category: dossier.category, submittedAt: torontoParts(r.createdAt).date, preferredDate: dossier.schedule.availabilities[0]?.date ?? '', location: addressText(r.address), description: r.description ?? '', status: r.status === 'NEW' ? 'new' : r.status === 'UNDER_REVIEW' ? 'review' : r.status === 'AWAITING_CLIENT' ? 'offer-sent' : r.status === 'COMPLETED' ? 'completed' : r.status === 'CLOSED' ? 'closed' : r.status === 'CANCELLED' ? 'cancelled' : 'confirmed' }; }),
  employees: users.filter(u => u.role === 'EMPLOYEE').map(employeesFrom),
  clients: users.filter(u => u.role === 'CLIENT').map(u => ({ id: u.id, name: u.firstName + ' ' + u.lastName, email: u.email, phone: u.phone ?? '', address: requests.find(r => r.clientId === u.id)?.address ? addressText(requests.find(r => r.clientId === u.id)!.address) : '', kind: requests.some(r => r.clientId === u.id && r.requestType === 'BUSINESS') ? 'Entreprise' : 'Résidentiel', requestIds: requests.filter(r => r.clientId === u.id).map(r => r.id) })),
  offers: offers.map(offerFrom), missions: mappedMissions, services: [], settings, audit: [],
 };
 enableSharedWorkspace(); useAdminStore.setState({ ...data, ownerId: owner.id }); useSupportStore.setState({ tickets });
}
async function refreshAfterMutation() {
 try { await loadAdminData(); }
 catch { useAdminApiStatus.setState({ error: "Action enregistrée. Actualisation impossible : vérifiez votre connexion." }); }
}
async function perform<T>(action: () => Promise<T>): Promise<AdminResult<T>> {
 if (useAdminApiStatus.getState().busy) return { ok: false, error: 'Une action est déjà en cours.' };
 useAdminApiStatus.setState({ busy: true, error: undefined });
 try { const value = await action(); await refreshAfterMutation(); return { ok: true, value }; }
 catch (error) { const message = error instanceof Error ? error.message : 'Action impossible'; useAdminApiStatus.setState({ error: message }); return { ok: false, error: message }; }
 finally { useAdminApiStatus.setState({ busy: false }); }
}
async function ensureMission(id: string) {
 if (!id.startsWith('appointment:')) return id;
 const appointmentId = id.slice('appointment:'.length);
 const a = await request<AppointmentDto>('GET', '/appointments/' + appointmentId);
 if (a.status === 'PENDING_CONFIRMATION') {
  if (!a.scheduledStart || !a.scheduledEnd) throw new ApiError('Définissez le créneau du rendez-vous avant l’affectation.');
  await request('POST', '/appointments/' + appointmentId + '/confirm', { scheduledStart: a.scheduledStart, scheduledEnd: a.scheduledEnd });
 }
 const existing = (await request<MissionDto[]>('GET', '/missions')).find(m => m.appointmentId === appointmentId);
 const mission = existing ?? await request<MissionDto>('POST', '/missions', { appointmentId });
 const dossier = useAdminStore.getState().requests.find(r => r.id === a.requestId)?.dossier;
 const items = dossier?.category === 'RESIDENTIAL' ? dossier.residential.services : dossier?.business.zones;
 if (!mission.checklistItems.length && items?.length) await request('POST', '/missions/' + mission.id + '/checklist', { items });
 return mission.id;
}
export const adminActions = {
 async saveEstimate(input: EstimateInput) {
  if (!apiMode) return useAdminStore.getState().saveEstimate(input);
  return perform(async () => {
   const dossier = await request<RequestDto>('GET', '/requests/' + input.requestId);
   if (dossier.status === 'NEW') await request('PATCH', '/requests/' + input.requestId + '/status', { status: 'UNDER_REVIEW' });
   const payload = { validityHours: input.validityHours, items: [{ description: 'Prestation de nettoyage', qty: 1, unitPrice: Number(input.subtotal.replace(',', '.')) }], estimatedMinutes: Math.round(input.durationHours * 60), employeesNeeded: input.employeeCount, proposedStart: toInstant(input.date, input.startTime), proposedEnd: toInstant(input.date, input.endTime), notes: input.notes, requiresBeforePhotos: input.requiresBeforePhotos, requiresAfterPhotos: input.requiresAfterPhotos };
   return offerFrom(await request<QuoteDto>(input.offerId ? 'PATCH' : 'POST', input.offerId ? '/quotes/' + input.offerId : '/requests/' + input.requestId + '/quotes', payload));
  });
 },
 async sendOffer(id: string) { if (!apiMode) return useAdminStore.getState().sendOffer(id); return perform(async () => offerFrom(await request<QuoteDto>('POST', '/quotes/' + id + '/send', {}))); },
 async cancelOffer(id: string) { if (!apiMode) return useAdminStore.getState().cancelOffer(id); return perform(async () => { await request('DELETE', '/quotes/' + id); }); },
 async resolveOffer(id: string, decision: 'accepted' | 'refused'): Promise<AdminResult<AdminOffer>> { if (!apiMode) return useAdminStore.getState().resolveOffer(id, decision); return { ok: false, error: 'Seul le client peut répondre à son offre.' }; },
 async markRequestReview(id: string) { if (!apiMode) { useAdminStore.getState().markRequestReview(id); return; } await perform(async () => { const r = await request<RequestDto>('GET', '/requests/' + id); if (r.status === 'NEW') await request('PATCH', '/requests/' + id + '/status', { status: 'UNDER_REVIEW' }); }); },
 async setMissionEmployees(id: string, employeeIds: string[]) { if (!apiMode) return useAdminStore.getState().setMissionEmployees(id, employeeIds); return perform(async () => { const missionId = await ensureMission(id); await request('PUT', '/missions/' + missionId + '/team', { employeeIds }); return missionId; }); },
 async rescheduleMission(id: string, date: string, start: string, end: string) { if (!apiMode) return useAdminStore.getState().rescheduleMission(id, date, start, end); return perform(async () => { const appointmentId = appointmentIds.get(id); if (!appointmentId) throw new ApiError('Actualisez le dossier.'); const a = await request<AppointmentDto>('GET', '/appointments/' + appointmentId); await request('POST', '/appointments/' + appointmentId + (a.status === 'PENDING_CONFIRMATION' ? '/confirm' : '/reschedule'), { scheduledStart: toInstant(date, start), scheduledEnd: toInstant(date, end) }); }); },
 async cancelMission(id: string) { if (!apiMode) return useAdminStore.getState().cancelMission(id); return perform(async () => { await request('POST', '/appointments/' + appointmentIds.get(id) + '/cancel'); }); },
 async updateEmployee(id: string, input: EmployeeInput) { if (!apiMode) return useAdminStore.getState().updateEmployee(id, input); return perform(async () => { const { city, specialties, availability, workingHours, ...profile } = input; await request('PATCH', '/users/' + id + '/employee-profile', { ...profile, employeeDetails: { city, specialties, availability, workingHours } }); }); },
 async setEmployeeActive(id: string, active: boolean) { if (!apiMode) return useAdminStore.getState().setEmployeeActive(id, active); return perform(async () => { await request('PATCH', '/users/' + id + '/status', { status: active ? 'ACTIVE' : 'SUSPENDED' }); }); },
 async updateSettings(values: AdminSettings) { if (!apiMode) return useAdminStore.getState().updateSettings(values); return perform(async () => { await request('PUT', '/admin/settings', values); }); },
 async updateService(id: string, values: Pick<AdminService, 'name' | 'description' | 'active'>) { if (!apiMode) return useAdminStore.getState().updateService(id, values); return perform(async () => unavailable('Catalogue de services')); },
};
export async function createApiEmployee(input: EmployeeInput) {
 const result = await request<{ user: UserDto; tempPassword: string }>('POST', '/users/employees', { email: input.email, firstName: input.firstName, lastName: input.lastName, phone: input.phone, employeeDetails: { city: input.city, specialties: input.specialties, availability: input.availability, workingHours: input.workingHours } });
 await refreshAfterMutation(); return { id: result.user.id, email: result.user.email, password: result.tempPassword };
}
