import { create } from 'zustand';
import type {
  AdminClient,
  AdminEmployee,
  AdminMission,
  AdminOffer,
  EstimateDraft,
} from '../types/admin';

const now = () => new Date().toISOString();
const log = (label: string) => ({ id: Math.random().toString(36).slice(2), at: now(), label });

const initialEmployees: AdminEmployee[] = [
  { id: 'emp-1', firstName: 'Nadia', lastName: 'Benali', email: 'nadia@magicpro.demo', phone: '514 555-0131', city: 'Montréal', specialties: ['Résidentiel', 'Commercial'], availability: 'Lun–Ven · 8 h à 17 h', status: 'ACTIVE' },
  { id: 'emp-2', firstName: 'Samuel', lastName: 'Roy', email: 'samuel@magicpro.demo', phone: '514 555-0148', city: 'Laval', specialties: ['Commercial', 'Médical'], availability: 'Mar–Sam · 7 h à 16 h', status: 'ACTIVE' },
  { id: 'emp-3', firstName: 'Lina', lastName: 'Gagnon', email: 'lina@magicpro.demo', phone: '438 555-0182', city: 'Montréal', specialties: ['Résidentiel'], availability: 'Lun–Ven · 9 h à 18 h', status: 'ACTIVE' },
  { id: 'emp-4', firstName: 'Karim', lastName: 'Diallo', email: 'karim@magicpro.demo', phone: '450 555-0107', city: 'Longueuil', specialties: ['Industriel'], availability: 'Lun–Jeu · 6 h à 15 h', status: 'SUSPENDED' },
];

const initialClients: AdminClient[] = [
  { id: 'client-1', kind: 'RESIDENTIAL', name: 'Sophie Tremblay', email: 'sophie@example.com', phone: '514 555-0110', address: '123 rue Sainte-Catherine, Montréal' },
  { id: 'client-2', kind: 'BUSINESS', name: 'Bureau Lavoie & Associés', email: 'contact@lavoie.example', phone: '514 555-0190', address: '456 boul. René-Lévesque, Montréal' },
  { id: 'client-3', kind: 'BUSINESS', name: 'Clinique du Parc', email: 'accueil@clinique.example', phone: '450 555-0166', address: '789 avenue du Parc, Laval' },
];

const initialOffers: AdminOffer[] = [
  {
    id: 'offer-1', reference: 'OFF-2026-101', requestId: 'demo-request-001', clientId: 'client-1',
    clientName: 'Sophie Tremblay', serviceName: 'Grand ménage résidentiel', address: '123 rue Sainte-Catherine, Montréal',
    startAt: '2026-10-22T09:00:00', endAt: '2026-10-22T12:00:00', durationMinutes: 180, employeeCount: 2,
    subtotalCents: 18000, taxRateBps: 1498, taxCents: 2696, totalCents: 20696, validDays: 7,
    notes: 'Cuisine et salle de bain prioritaires.', conditions: 'Matériel et déplacement inclus.',
    status: 'SENT', createdAt: '2026-10-20T14:00:00',
  },
  {
    id: 'offer-2', reference: 'OFF-2026-099', requestId: 'demo-request-006', clientId: 'client-2',
    clientName: 'Bureau Lavoie & Associés', serviceName: 'Entretien commercial', address: '456 boul. René-Lévesque, Montréal',
    startAt: '2026-10-24T14:00:00', endAt: '2026-10-24T17:00:00', durationMinutes: 180, employeeCount: 2,
    subtotalCents: 24000, taxRateBps: 1498, taxCents: 3595, totalCents: 27595, validDays: 7,
    notes: 'Intervention après les heures de bureau.', conditions: 'Produits écologiques inclus.',
    status: 'ACCEPTED', createdAt: '2026-10-18T14:00:00',
  },
];

const initialMissions: AdminMission[] = [
  {
    id: 'mission-1', reference: 'MS-2026-041', offerId: 'offer-2', clientId: 'client-2',
    clientName: 'Bureau Lavoie & Associés', serviceName: 'Entretien commercial', address: '456 boul. René-Lévesque, Montréal',
    startAt: '2026-10-24T14:00:00', endAt: '2026-10-24T17:00:00', employeeCount: 2,
    employeeIds: [], status: 'TO_ASSIGN', checklist: ['Cuisine', 'Salle de réunion', 'Planchers', 'Fenêtres'],
    instructions: 'Accès par la réception. Sonner à l’arrivée.', logs: [log('Mission créée depuis l’offre acceptée')],
  },
];

function taxCents(subtotalCents: number, taxRateBps: number) {
  return Math.round(subtotalCents * taxRateBps / 10000);
}

function overlap(startA: string, endA: string, startB: string, endB: string) {
  return new Date(startA).getTime() < new Date(endB).getTime() && new Date(startB).getTime() < new Date(endA).getTime();
}

interface AdminState {
  ownerId: string | null;
  offers: AdminOffer[];
  missions: AdminMission[];
  employees: AdminEmployee[];
  clients: AdminClient[];
  drafts: Record<string, EstimateDraft>;
  bindOwner: (ownerId: string | null) => void;
  reset: () => void;
  saveDraft: (draft: EstimateDraft) => AdminOffer;
  sendOffer: (offerId: string) => void;
  simulateOfferResponse: (offerId: string, accepted: boolean) => void;
  assignMission: (missionId: string, employeeIds: string[]) => { ok: boolean; message?: string };
  updateMissionSchedule: (missionId: string, startAt: string, endAt: string) => { ok: boolean; message?: string };
  cancelMission: (missionId: string) => void;
  createEmployee: (employee: Omit<AdminEmployee, 'id' | 'status'>) => { ok: boolean; id?: string; message?: string };
  updateEmployee: (employeeId: string, patch: Partial<AdminEmployee>) => void;
  toggleEmployeeStatus: (employeeId: string) => void;
}

const initialState = () => ({
  ownerId: null as string | null,
  offers: initialOffers.map(item => ({ ...item })),
  missions: initialMissions.map(item => ({ ...item, employeeIds: [...item.employeeIds], checklist: [...item.checklist], logs: [...item.logs] })),
  employees: initialEmployees.map(item => ({ ...item, specialties: [...item.specialties] })),
  clients: initialClients.map(item => ({ ...item })),
  drafts: {} as Record<string, EstimateDraft>,
});

export const useAdminStore = create<AdminState>((set, get) => ({
  ...initialState(),
  bindOwner: ownerId => {
    if (ownerId === null) set(initialState());
    else set({ ownerId });
  },
  reset: () => set(initialState()),
  saveDraft: draft => {
    const tax = taxCents(draft.subtotalCents, draft.taxRateBps);
    const existing = get().offers.find(item => item.requestId === draft.requestId && item.status === 'DRAFT');
    const offer: AdminOffer = {
      id: existing?.id ?? 'offer-' + Date.now(),
      reference: existing?.reference ?? 'OFF-' + new Date().getFullYear() + '-' + String(get().offers.length + 102).padStart(3, '0'),
      ...draft,
      taxCents: tax,
      totalCents: draft.subtotalCents + tax,
      status: 'DRAFT',
      createdAt: existing?.createdAt ?? now(),
    };
    set(state => ({
      drafts: { ...state.drafts, [draft.requestId]: draft },
      offers: existing ? state.offers.map(item => item.id === offer.id ? offer : item) : [offer, ...state.offers],
    }));
    return offer;
  },
  sendOffer: offerId => set(state => ({ offers: state.offers.map(item => item.id === offerId ? { ...item, status: 'SENT' } : item) })),
  simulateOfferResponse: (offerId, accepted) => {
    const offer = get().offers.find(item => item.id === offerId);
    if (!offer) return;
    set(state => ({ offers: state.offers.map(item => item.id === offerId ? { ...item, status: accepted ? 'ACCEPTED' : 'REFUSED' } : item) }));
    if (!accepted || get().missions.some(item => item.offerId === offerId)) return;
    const mission: AdminMission = {
      id: 'mission-' + Date.now(), reference: 'MS-' + new Date().getFullYear() + '-' + String(get().missions.length + 42).padStart(3, '0'),
      offerId: offer.id, clientId: offer.clientId, clientName: offer.clientName, serviceName: offer.serviceName, address: offer.address,
      startAt: offer.startAt, endAt: offer.endAt, employeeCount: offer.employeeCount, employeeIds: [], status: 'TO_ASSIGN',
      checklist: ['Préparer le matériel', 'Réaliser la prestation', 'Photos après intervention'], instructions: offer.notes,
      logs: [log('Mission créée depuis l’offre acceptée')],
    };
    set(state => ({ missions: [mission, ...state.missions] }));
  },
  assignMission: (missionId, employeeIds) => {
    const mission = get().missions.find(item => item.id === missionId);
    if (!mission) return { ok: false, message: 'Mission introuvable.' };
    const unique = [...new Set(employeeIds)];
    if (unique.length !== mission.employeeCount) return { ok: false, message: 'Sélectionnez exactement ' + mission.employeeCount + ' employé(s).' };
    const employees = unique.map(id => get().employees.find(item => item.id === id));
    if (employees.some(item => !item || item.status !== 'ACTIVE')) return { ok: false, message: 'Un employé sélectionné est suspendu ou introuvable.' };
    const conflict = get().missions.some(other => other.id !== mission.id && other.status !== 'CANCELLED' && overlap(mission.startAt, mission.endAt, other.startAt, other.endAt) && other.employeeIds.some(id => unique.includes(id)));
    if (conflict) return { ok: false, message: 'Conflit détecté avec une autre mission.' };
    set(state => ({ missions: state.missions.map(item => item.id === missionId ? { ...item, employeeIds: unique, status: 'PLANNED', logs: [...item.logs, log('Équipe assignée')] } : item) }));
    return { ok: true };
  },
  updateMissionSchedule: (missionId, startAt, endAt) => {
    if (new Date(endAt).getTime() <= new Date(startAt).getTime()) return { ok: false, message: 'L’heure de fin doit être après le début.' };
    const mission = get().missions.find(item => item.id === missionId);
    if (!mission) return { ok: false, message: 'Mission introuvable.' };
    const conflict = get().missions.some(other => other.id !== missionId && other.status !== 'CANCELLED' && overlap(startAt, endAt, other.startAt, other.endAt) && other.employeeIds.some(id => mission.employeeIds.includes(id)));
    if (conflict) return { ok: false, message: 'La nouvelle plage crée un conflit d’affectation.' };
    set(state => ({ missions: state.missions.map(item => item.id === missionId ? { ...item, startAt, endAt, logs: [...item.logs, log('Créneau modifié')] } : item) }));
    return { ok: true };
  },
  cancelMission: missionId => set(state => ({ missions: state.missions.map(item => item.id === missionId ? { ...item, status: 'CANCELLED', logs: [...item.logs, log('Mission annulée')] } : item) })),
  createEmployee: employee => {
    if (get().employees.some(item => item.email.trim().toLowerCase() === employee.email.trim().toLowerCase())) return { ok: false, message: 'Ce courriel est déjà utilisé.' };
    const id = 'emp-' + Date.now();
    set(state => ({ employees: [{ ...employee, id, status: 'ACTIVE' }, ...state.employees] }));
    return { ok: true, id };
  },
  updateEmployee: (employeeId, patch) => set(state => ({ employees: state.employees.map(item => item.id === employeeId ? { ...item, ...patch, id: item.id } : item) })),
  toggleEmployeeStatus: employeeId => set(state => ({ employees: state.employees.map(item => item.id === employeeId ? { ...item, status: item.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : item) })),
}));
