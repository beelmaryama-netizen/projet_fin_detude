import { useAdminStore, assignedEmployees, enableSharedWorkspace } from '../features/employer/store/adminStore';
import type { ClientBridge } from '../features/client/services/mockClientService';
import type { EmployeeBridge } from '../features/employee/services/mockEmployeeService';
import type { ClientQuote, ClientRequest, RequestStatus } from '../features/client/types/client';
import type { ClientReservation } from '../features/client/types/reservation';
import type { EmployeeMission } from '../features/employee/types/employee';
import { EmployeeServiceError } from '../features/employee/types/employee';
import { addressLabel } from '../features/client/services/clientFormatters';
import type { User } from '../types/identity';
const copy = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
export function torontoInstant(date: string, time: string): string {
 const target = Date.parse(date + 'T' + time + ':00Z'); let result = target;
 for (let i = 0; i < 3; i++) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(result));
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  const wall = Date.parse(p.year + '-' + p.month + '-' + p.day + 'T' + p.hour + ':' + p.minute + ':00Z');
  result += target - wall;
 }
 return new Date(result).toISOString();
}
function requestAddress(request: ClientRequest) { return request.category === 'RESIDENTIAL' ? addressLabel(request.address) : request.business.siteAddress; }
export const clientBridge: ClientBridge = {
 created(user, request) {
  const state = useAdminStore.getState();
  if (state.requests.some(r => r.id === request.id)) return;
  const client = state.clients.find(c => c.id === user.id);
  useAdminStore.setState({
   requests: [{ id: request.id, clientId: user.id, dossier: copy(request), clientName: user.firstName + ' ' + user.lastName, serviceType: request.serviceTitle, category: request.category, submittedAt: request.createdAt, preferredDate: request.schedule.availabilities[0]?.date ?? '', location: requestAddress(request), description: request.category === 'RESIDENTIAL' ? request.residential.description : request.business.description, status: 'new' }, ...state.requests],
   clients: client ? state.clients.map(c => c.id === user.id ? { ...c, requestIds: [...c.requestIds, request.id] } : c) : [{ id: user.id, name: user.firstName + ' ' + user.lastName, email: user.email, phone: user.phone ?? '', address: requestAddress(request), kind: request.category === 'RESIDENTIAL' ? 'Résidentiel' : 'Entreprise', requestIds: [request.id] }, ...state.clients],
  });
 },
 decision(user, quoteId, decision) {
  const state = useAdminStore.getState(); const offer = state.offers.find(o => o.id === quoteId); if (!offer) return;
  if (!state.requests.some(r => r.id === offer.requestId && r.clientId === user.id)) throw new Error('Offre non autorisée.');
  const result = state.resolveOffer(quoteId, decision); if (!result.ok) throw new Error(result.error);
 },
 cancel(user, quoteId) {
  const state = useAdminStore.getState(); const mission = state.missions.find(m => m.offerId === quoteId); if (!mission) return;
  if (!state.requests.some(r => r.id === mission.requestId && r.clientId === user.id)) throw new Error('Réservation non autorisée.');
  const result = state.cancelMission(mission.id); if (!result.ok) throw new Error(result.error);
 },
 sync(user, db) {
  const state = useAdminStore.getState();
  for (const source of state.requests.filter(r => r.clientId === user.id && r.dossier)) {
   let request = db.requests.find(r => r.id === source.id);
   if (!request && source.dossier) { request = copy(source.dossier); db.requests.unshift(request); }
   if (!request) continue;
   const status: RequestStatus = ({ new: 'NEW', review: 'IN_REVIEW', waiting: 'IN_REVIEW', 'offer-sent': 'QUOTED', confirmed: 'ACCEPTED', completed: 'CLOSED', closed: 'CLOSED', cancelled: 'CANCELLED' } as const)[source.status];
   if (request.status !== status && !['CANCELLED', 'CLOSED'].includes(request.status)) { request.status = status; request.history.push({ at: new Date().toISOString(), label: 'Dossier actualisé par MagicPro' }); }
   for (const offer of state.offers.filter(o => o.requestId === source.id && o.status !== 'draft')) {
    const quote: ClientQuote = { id: offer.id, requestId: source.id, serviceTitle: source.serviceType, address: source.location,
     status: ({ sent: 'PENDING', accepted: 'ACCEPTED', refused: 'REJECTED', expired: 'EXPIRED', cancelled: 'EXPIRED', draft: 'PENDING' } as const)[offer.status],
     employeeCount: offer.employeeCount, durationHours: offer.durationHours, startAt: torontoInstant(offer.date, offer.startTime), endAt: torontoInstant(offer.date, offer.endTime), expiresAt: offer.validUntil ?? new Date().toISOString(),
     lines: [{ label: 'Prestation', cents: offer.subtotalCents }], taxes: [{ label: 'Taxes (' + offer.taxPercent + ' %)', cents: offer.taxCents }], totalCents: offer.totalCents, adminNote: offer.notes };
    const previous = db.quotes.find(q => q.id === quote.id);
    if (previous) Object.assign(previous, quote); else {
     db.quotes.unshift(quote);
     db.notifications.unshift({ id: 'offer-' + offer.id, title: 'Nouvelle offre', text: source.serviceType, read: false, createdAt: offer.sentAt ?? new Date().toISOString(), target: { kind: 'quote', id: quote.id } });
    }
    const mission = state.missions.find(m => m.offerId === offer.id); if (!mission) continue;
    const old = db.reservations.find(r => r.quoteId === offer.id);
    const reservation: ClientReservation = { id: old?.id ?? 'reservation-' + mission.id, requestId: source.id, quoteId: quote.id, serviceTitle: source.serviceType,
     status: ({ unassigned: 'PENDING', planned: 'CONFIRMED', 'in-progress': 'IN_PROGRESS', completed: 'COMPLETED', cancelled: 'CANCELLED' } as const)[mission.status],
     startAt: torontoInstant(mission.date, mission.startTime), endAt: torontoInstant(mission.date, mission.endTime), timeZone: 'America/Toronto', address: source.location, instructions: request.schedule.instructions, summary: source.description,
     cancellationDeadline: new Date(Date.parse(torontoInstant(mission.date, mission.startTime)) - 86400000).toISOString(),
     team: state.employees.filter(e => assignedEmployees(mission).includes(e.id)).map(e => e.firstName + ' ' + e.lastName), completedAt: mission.completedAt, report: mission.report };
    const eventId = 'booking-' + mission.id + '-' + mission.status + '-' + mission.date + '-' + mission.startTime;
    if ((!old || old.status !== reservation.status || old.startAt !== reservation.startAt) && !db.notifications.some(n => n.id === eventId)) {
     db.notifications.unshift({ id: eventId, title: 'Suivi de votre réservation', text: reservation.serviceTitle, read: false, createdAt: new Date().toISOString(), target: { kind: 'reservation', id: reservation.id } });
     request.history.push({ at: new Date().toISOString(), label: ({ PENDING: 'Offre acceptée', CONFIRMED: 'Rendez-vous confirmé', IN_PROGRESS: 'Service en cours', COMPLETED: 'Service terminé', CANCELLED: 'Réservation annulée' })[reservation.status] });
    }
    if (old) Object.assign(old, reservation); else db.reservations.unshift(reservation);
    if (mission.status === 'completed') request.status = 'CLOSED'; else if (mission.status === 'cancelled') request.status = 'CANCELLED';
   }
  }
 },
};
function employeeFor(user: User) {
 const employee = useAdminStore.getState().employees.find(e => e.email.toLowerCase() === user.email.toLowerCase());
 if (!employee?.active || user.role !== 'EMPLOYEE' || user.mustChangePassword) throw new EmployeeServiceError('Votre accès employé est indisponible. Contactez l’administration.');
 return employee;
}
export const employeeBridge: EmployeeBridge = {
 sync(user, db) {
  const state = useAdminStore.getState(); const employee = employeeFor(user);
  db.missions = state.missions.filter(m => assignedEmployees(m).includes(employee.id)).map(m => {
   const request = state.requests.find(r => r.id === m.requestId); const dossier = request?.dossier;
   const instructions = dossier ? [dossier.schedule.instructions, dossier.category !== 'RESIDENTIAL' ? [dossier.business.constraints, dossier.business.equipment, dossier.business.allowedProducts, dossier.business.restrictedAreas].filter(Boolean).join('\n') : dossier.residential.parking].filter(Boolean).join('\n') : m.notes;
   const item: EmployeeMission = { id: m.id, title: request?.serviceType ?? 'Service', status: ({ unassigned: 'PLANNED', planned: 'PLANNED', 'in-progress': 'IN_PROGRESS', completed: 'COMPLETED', cancelled: 'CANCELLED' } as const)[m.status],
    startAt: torontoInstant(m.date, m.startTime), endAt: torontoInstant(m.date, m.endTime), address: request?.location ?? '', description: request?.description ?? '', instructions,
    accessNotes: dossier?.schedule.accessNotes ?? '', team: state.employees.filter(e => assignedEmployees(m).includes(e.id)).map(e => e.firstName + ' ' + e.lastName),
    checklist: m.checklist.map(t => ({ id: t.id, label: t.label, isDone: t.completed, note: t.note })), photos: copy(m.photos ?? []), clientPhotos: copy(dossier?.photos ?? []),
    requiresBeforePhotos: m.requiresBeforePhotos, requiresAfterPhotos: m.requiresAfterPhotos, startedAt: m.startedAt, completedAt: m.completedAt, report: m.report, incident: m.incident };
   return item;
  });
  for (const m of db.missions) {
   const id = 'assignment-' + m.id + '-' + m.status + '-' + m.startAt;
   if (!db.notifications.some(n => n.id === id)) db.notifications.unshift({ id, title: 'Planning actualisé', message: m.title, missionId: m.id, read: false, createdAt: new Date().toISOString() });
  }
  db.notifications = db.notifications.filter(n => db.missions.some(m => m.id === n.missionId));
 },
 changed(user, mission) {
  const employee = employeeFor(user); const state = useAdminStore.getState(); const source = state.missions.find(m => m.id === mission.id);
  if (!source || !assignedEmployees(source).includes(employee.id) || ['completed', 'cancelled'].includes(source.status)) throw new EmployeeServiceError('Cette affectation a changé. Actualisez la mission.');
  useAdminStore.setState({ missions: state.missions.map(m => m.id === mission.id ? { ...m,
   status: ({ PLANNED: 'planned', IN_PROGRESS: 'in-progress', COMPLETED: 'completed', CANCELLED: 'cancelled' } as const)[mission.status],
   checklist: mission.checklist.map(t => ({ id: t.id, label: t.label, completed: t.isDone, note: t.note })), photos: copy(mission.photos), startedAt: mission.startedAt, completedAt: mission.completedAt, report: mission.report, incident: mission.incident } : m),
   audit: [{ id: 'execution-' + Date.now(), at: new Date().toISOString(), text: 'Intervention actualisée par ' + user.firstName, entityId: mission.id }, ...state.audit].slice(0, 200) });
 },
};
export function initializeSharedWorkflow() { enableSharedWorkspace(); }
