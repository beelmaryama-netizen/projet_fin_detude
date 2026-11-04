import { create } from 'zustand';
import { useAuthStore } from '../../../store/authStore';
import { getEmployerRequests } from '../services/mockEmployerService';
import { isValidDate, localDate, parseDecimal, timeMinutes } from '../services/adminHelpers';
import type { AdminData, AdminEmployee, AdminMission, AdminOffer, AdminResult, AdminStore, EmployeeInput, EstimateInput } from '../types/admin';

let sequence = 100;
const id = (prefix: string) => `${prefix}-${++sequence}`;
const ok = <T,>(value: T): AdminResult<T> => ({ ok: true, value });
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
function shiftedDay(offset: number): string {
  const date = new Date(); date.setDate(date.getDate() + offset); return localDate(date);
}
export const assignedEmployees = (mission: AdminMission): string[] => mission.employeeIds ?? (mission.employeeId ? [mission.employeeId] : []);

export function employeeConflict(missions: AdminMission[], employeeId: string, candidate: Pick<AdminMission, 'id' | 'date' | 'startTime' | 'endTime'>): boolean {
  const start = timeMinutes(candidate.startTime), end = timeMinutes(candidate.endTime);
  if (start === null || end === null) return true;
  return missions.some(m => m.id !== candidate.id && m.date === candidate.date
    && m.status !== 'cancelled' && m.status !== 'completed' && assignedEmployees(m).includes(employeeId)
    && start < (timeMinutes(m.endTime) ?? 0) && end > (timeMinutes(m.startTime) ?? 1440));
}

export function createAdminDemoData(): AdminData {
  const requests = getEmployerRequests();
  const createdAt = new Date().toISOString();
  const employees: AdminEmployee[] = [
    { id: 'EMP-001', firstName: 'Sarah', lastName: 'Martin', email: 'sarah@magicpro.example', phone: '5145550101', city: 'Montréal', specialties: ['Résidentiel', 'Commercial'], availability: 'Du lundi au vendredi · 8 h à 18 h', active: true, activationPending: false, createdAt },
    { id: 'EMP-002', firstName: 'Ahmed', lastName: 'Benali', email: 'ahmed@magicpro.example', phone: '5145550102', city: 'Laval', specialties: ['Commercial', 'Industriel'], availability: 'Du lundi au samedi · 7 h à 20 h', active: true, activationPending: false, createdAt },
    { id: 'EMP-003', firstName: 'Léa', lastName: 'Nguyen', email: 'lea@magicpro.example', phone: '5145550103', city: 'Montréal', specialties: ['Médical', 'Résidentiel'], availability: 'Du mardi au samedi · 9 h à 18 h', active: true, activationPending: false, createdAt },
    { id: 'EMP-004', firstName: 'Nicolas', lastName: 'Roy', email: 'nicolas@magicpro.example', phone: '5145550104', city: 'Longueuil', specialties: ['Commercial'], availability: 'Indisponible', active: false, activationPending: false, createdAt },
  ];
  const clients = requests.map((r, index) => ({
    id: `CLI-${String(index + 1).padStart(3, '0')}`, name: r.clientName,
    email: `client${index + 1}@magicpro.example`, phone: `51455501${String(index + 10).padStart(2, '0')}`,
    address: r.location, kind: r.category === 'RESIDENTIAL' ? 'Résidentiel' as const : 'Entreprise' as const, requestIds: [r.id],
  }));
  function seededOffer(index: number, status: AdminOffer['status']): AdminOffer {
    return { id: `OFF-${String(index + 1).padStart(3, '0')}`, requestId: requests[index]!.id, status,
      durationHours: 3, employeeCount: 1, subtotalCents: 18000, taxCents: 2696, totalCents: 20696, taxPercent: 14.975,
      date: requests[index]!.preferredDate, startTime: '09:00', endTime: '12:00', validityHours: 48,
      notes: 'Produits et matériel inclus. Offre de démonstration.', createdAt,
      ...(status !== 'draft' ? { sentAt: createdAt, validUntil: new Date(Date.now() + 48 * 3600_000).toISOString() } : {}) };
  }
  const offers = [seededOffer(2, 'draft'), seededOffer(4, 'sent'), seededOffer(5, 'accepted')];
  const checklist = () => [{ id: 'preparation', label: 'Préparer le matériel et vérifier les consignes', completed: false },
    { id: 'cleaning', label: 'Nettoyer les zones prévues', completed: false }, { id: 'control', label: 'Contrôler le résultat et ranger le matériel', completed: false }];
  // Additional demo passages illustrate a recurring client's mission history without inventing more requests.
  const missions: AdminMission[] = [
    { id: 'MIS-001', requestId: requests[5]!.id, offerId: offers[2]!.id, date: requests[5]!.preferredDate, startTime: '09:00', endTime: '12:00', status: 'unassigned', checklist: checklist(), notes: 'Offre acceptée : équipe à affecter.' },
    { id: 'MIS-002', requestId: requests[5]!.id, employeeId: employees[0]!.id, employeeIds: [employees[0]!.id], date: shiftedDay(1), startTime: '08:00', endTime: '10:00', status: 'planned', checklist: checklist(), notes: 'Passage récurrent de démonstration.' },
    { id: 'MIS-003', requestId: requests[5]!.id, employeeId: employees[1]!.id, employeeIds: [employees[1]!.id], date: shiftedDay(0), startTime: '08:00', endTime: '10:00', status: 'in-progress', checklist: checklist().map((t, i) => ({ ...t, completed: i === 0 })), notes: 'Passage récurrent de démonstration.', startedAt: `${shiftedDay(0)}T08:04:00` },
    { id: 'MIS-004', requestId: requests[5]!.id, employeeId: employees[0]!.id, employeeIds: [employees[0]!.id], date: shiftedDay(-7), startTime: '08:00', endTime: '10:00', status: 'completed', checklist: checklist().map(t => ({ ...t, completed: true })), notes: 'Passage précédent de démonstration.', report: 'Entretien effectué. Aucun incident signalé. Matériel rangé.', startedAt: `${shiftedDay(-7)}T08:00:00`, completedAt: `${shiftedDay(-7)}T10:02:00` },
  ];
  return { requests, employees, clients, offers, missions,
    services: [
      { id: 'SVC-001', name: 'Ménage résidentiel', category: 'RESIDENTIAL', description: 'Entretien régulier et grand ménage des logements.', active: true },
      { id: 'SVC-002', name: 'Entretien commercial', category: 'COMMERCIAL', description: 'Bureaux, commerces et espaces professionnels.', active: true },
      { id: 'SVC-003', name: 'Nettoyage industriel', category: 'INDUSTRIAL', description: 'Zones de production, entrepôts et équipements autorisés.', active: true },
      { id: 'SVC-004', name: 'Entretien médical', category: 'MEDICAL', description: 'Cliniques et espaces de soins selon leurs protocoles.', active: true },
      { id: 'SVC-005', name: 'Après construction', category: 'OTHER', description: 'Remise en état après travaux.', active: false },
    ],
    settings: { companyName: 'MagiquePro', contactEmail: 'contact@magicpro.example', contactPhone: '5145550100', defaultTaxPercent: 14.975, defaultValidityHours: 48, notifyNewRequests: true },
    audit: [{ id: 'LOG-001', at: createdAt, text: 'Offre acceptée dans les données de démonstration.', entityId: 'MIS-001' }],
  };
}

function validateSlot(date: string, start: string, end: string): string | null {
  if (!isValidDate(date)) return 'Saisissez une date valide au format AAAA-MM-JJ.';
  if (date < localDate()) return 'Choisissez une date à partir d’aujourd’hui.';
  const from = timeMinutes(start), to = timeMinutes(end);
  if (from === null || to === null) return 'Saisissez les heures au format HH:mm (ex. 09:00).';
  return to <= from ? 'L’heure de fin doit suivre l’heure de début le même jour.' : null;
}
export function validateEstimate(input: EstimateInput): string | null {
  const slot = validateSlot(input.date, input.startTime, input.endTime);
  if (slot) return slot;
  if (!Number.isFinite(input.durationHours) || input.durationHours < 0.25 || input.durationHours > 24) return 'La durée doit être comprise entre 0,25 et 24 heures.';
  if ((timeMinutes(input.endTime)! - timeMinutes(input.startTime)!) / 60 < input.durationHours) return 'Le créneau doit couvrir la durée estimée.';
  if (!Number.isInteger(input.employeeCount) || input.employeeCount < 1 || input.employeeCount > 20) return 'Prévoyez de 1 à 20 employés.';
  const subtotal = parseDecimal(input.subtotal), tax = parseDecimal(input.taxPercent);
  if (subtotal === null || subtotal <= 0 || subtotal > 100000 || Math.abs(subtotal * 100 - Math.round(subtotal * 100)) > 0.00001) return 'Le sous-total doit être un montant positif, avec au plus deux décimales.';
  if (tax === null || tax > 30) return 'Le taux de taxes doit être compris entre 0 et 30 %.';
  if (!Number.isInteger(input.validityHours) || input.validityHours < 1 || input.validityHours > 720) return 'La validité doit être de 1 à 720 heures.';
  if (input.notes.length > 2000) return 'Les notes ne doivent pas dépasser 2 000 caractères.';
  return null;
}
function validateEmployee(input: EmployeeInput): string | null {
  if (!input.firstName.trim() || !input.lastName.trim() || !input.city.trim()) return 'Le prénom, le nom et la ville sont obligatoires.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return 'Saisissez un courriel valide.';
  if (input.phone.trim() && !/^\d{7,15}$/.test(input.phone.replace(/\D/g, ''))) return 'Le téléphone doit contenir de 7 à 15 chiffres.';
  if ([input.firstName, input.lastName, input.city, input.email].some(x => x.trim().length > 120)) return 'Les coordonnées ne doivent pas dépasser 120 caractères par champ.';
  return null;
}
const normalizeEmployee = (input: EmployeeInput) => ({ ...input, firstName: input.firstName.trim(), lastName: input.lastName.trim(),
  email: input.email.trim().toLowerCase(), phone: input.phone.trim(), city: input.city.trim(), availability: input.availability.trim(),
  specialties: [...new Set(input.specialties.map(s => s.trim()).filter(Boolean))] });

export const useAdminStore = create<AdminStore>((set, get) => {
  const audit = (text: string, entityId?: string) => [{ id: id('LOG'), at: new Date().toISOString(), text, entityId }, ...get().audit].slice(0, 200);
  function editableMission(missionId: string): AdminMission | null {
    return get().missions.find(m => m.id === missionId && (m.status === 'unassigned' || m.status === 'planned')) ?? null;
  }
  function expireOffers() {
    const expired = get().offers.filter(o => o.status === 'sent' && o.validUntil && Date.parse(o.validUntil) <= Date.now());
    if (!expired.length) return;
    const offerIds = new Set(expired.map(o => o.id)), requestIds = new Set(expired.map(o => o.requestId));
    set({ offers: get().offers.map(o => offerIds.has(o.id) ? { ...o, status: 'expired' } : o),
      requests: get().requests.map(r => requestIds.has(r.id) && r.status === 'offer-sent' ? { ...r, status: 'waiting' } : r),
      audit: audit(`${expired.length} offre(s) expirée(s) dans la démonstration.`) });
  }
  return {
    ...createAdminDemoData(), ownerId: null,
    bindOwner(ownerId) { if (get().ownerId !== ownerId) set({ ...createAdminDemoData(), ownerId }); },
    markRequestReview(requestId) {
      const request = get().requests.find(r => r.id === requestId);
      if (!request || request.status !== 'new') return;
      set({ requests: get().requests.map(r => r.id === requestId ? { ...r, status: 'review' } : r), audit: audit('Analyse de la demande commencée.', requestId) });
    },
    saveEstimate(input) {
      expireOffers();
      const error = validateEstimate(input); if (error) return fail(error);
      const state = get(), request = state.requests.find(r => r.id === input.requestId);
      if (!request) return fail('Cette demande est introuvable.');
      const previous = input.offerId ? state.offers.find(o => o.id === input.offerId) : state.offers.find(o => o.requestId === input.requestId && o.status === 'draft');
      if (input.offerId && (!previous || previous.requestId !== input.requestId)) return fail('Ce brouillon est introuvable.');
      if (previous && previous.status !== 'draft') return fail('Seul un brouillon peut être modifié.');
      if (state.offers.some(o => o.requestId === input.requestId && o.id !== previous?.id && (o.status === 'sent' || o.status === 'accepted'))) return fail('Une offre envoyée ou acceptée existe déjà pour cette demande.');
      const subtotalCents = Math.round(parseDecimal(input.subtotal)! * 100), taxPercent = parseDecimal(input.taxPercent)!;
      const taxCents = Math.round(subtotalCents * taxPercent / 100);
      const offer: AdminOffer = { ...input, id: previous?.id ?? id('OFF'), status: 'draft', subtotalCents, taxCents,
        totalCents: subtotalCents + taxCents, taxPercent, createdAt: previous?.createdAt ?? new Date().toISOString(), notes: input.notes.trim() };
      set({ offers: previous ? state.offers.map(o => o.id === previous.id ? offer : o) : [offer, ...state.offers],
        requests: state.requests.map(r => r.id === request.id && r.status === 'new' ? { ...r, status: 'review' } : r), audit: audit('Estimation enregistrée en brouillon.', offer.id) });
      return ok(offer);
    },
    sendOffer(offerId) {
      expireOffers();
      const offer = get().offers.find(o => o.id === offerId);
      if (!offer || offer.status !== 'draft') return fail('Seul un brouillon peut être envoyé.');
      if (offer.date < localDate()) return fail('La date de prestation est passée. Modifiez le brouillon.');
      const sentAt = new Date().toISOString();
      const sent: AdminOffer = { ...offer, status: 'sent', sentAt, validUntil: new Date(Date.now() + offer.validityHours * 3600_000).toISOString() };
      set({ offers: get().offers.map(o => o.id === offerId ? sent : o), requests: get().requests.map(r => r.id === offer.requestId ? { ...r, status: 'offer-sent' } : r), audit: audit('Envoi de l’offre simulé.', offerId) });
      return ok(sent);
    },
    resolveOffer(offerId, decision) {
      expireOffers();
      const offer = get().offers.find(o => o.id === offerId);
      if (offer?.status === 'expired') return fail('Cette offre a expiré. Préparez une nouvelle estimation.');
      if (!offer || offer.status !== 'sent') return fail('Cette offre n’attend plus de réponse.');
      if (offer.validUntil && Date.parse(offer.validUntil) <= Date.now()) {
        set({ offers: get().offers.map(o => o.id === offerId ? { ...o, status: 'expired' } : o), requests: get().requests.map(r => r.id === offer.requestId ? { ...r, status: 'waiting' } : r), audit: audit('Offre expirée.', offerId) });
        return fail('Cette offre a expiré. Préparez une nouvelle estimation.');
      }
      if (offer.date < localDate()) return fail('La prestation est passée. Annulez cette offre et préparez une nouvelle estimation.');
      const resolved = { ...offer, status: decision };
      const mission: AdminMission = { id: id('MIS'), requestId: offer.requestId, offerId, date: offer.date, startTime: offer.startTime, endTime: offer.endTime,
        status: 'unassigned', employeeIds: [], notes: offer.notes,
        checklist: [{ id: 'prepare', label: 'Vérifier les consignes et préparer le matériel', completed: false }, { id: 'clean', label: 'Réaliser les services prévus dans l’offre', completed: false }, { id: 'check', label: 'Contrôler le résultat et préparer le rapport', completed: false }] };
      set({ offers: get().offers.map(o => o.id === offerId ? resolved : o), requests: get().requests.map(r => r.id === offer.requestId ? { ...r, status: decision === 'accepted' ? 'confirmed' : 'waiting' } : r),
        missions: decision === 'accepted' ? [mission, ...get().missions] : get().missions,
        audit: audit(decision === 'accepted' ? 'Acceptation client simulée; mission créée à assigner.' : 'Refus client simulé.', decision === 'accepted' ? mission.id : offerId) });
      return ok(resolved);
    },
    cancelOffer(offerId) {
      const offer = get().offers.find(o => o.id === offerId);
      if (!offer || !['draft', 'sent'].includes(offer.status)) return fail('Cette offre ne peut plus être annulée.');
      set({ offers: get().offers.map(o => o.id === offerId ? { ...o, status: 'cancelled' } : o),
        requests: get().requests.map(r => r.id === offer.requestId && r.status === 'offer-sent' ? { ...r, status: 'waiting' } : r), audit: audit('Offre annulée dans la démonstration.', offerId) });
      return ok(undefined);
    },
    assignMission(missionId, employeeId) { return get().setMissionEmployees(missionId, [employeeId]); },
    setMissionEmployees(missionId, employeeIds) {
      const mission = editableMission(missionId); if (!mission) return fail('Seules les missions à assigner ou planifiées peuvent être affectées.');
      const slot = validateSlot(mission.date, mission.startTime, mission.endTime); if (slot) return fail(slot);
      const required = get().offers.find(o => o.id === mission.offerId)?.employeeCount ?? 1;
      const ids = [...new Set(employeeIds)];
      if (ids.length !== required || ids.length !== employeeIds.length) return fail(`Sélectionnez exactement ${required} employé${required > 1 ? 's' : ''} différent${required > 1 ? 's' : ''}.`);
      for (const employeeId of ids) {
        const employee = get().employees.find(e => e.id === employeeId);
        if (!employee || !employee.active) return fail('Un employé sélectionné est indisponible ou suspendu.');
        if (employeeConflict(get().missions, employeeId, mission)) return fail(`${employee.firstName} ${employee.lastName} a déjà une mission sur ce créneau.`);
      }
      set({ missions: get().missions.map(m => m.id === missionId ? { ...m, employeeId: ids[0], employeeIds: ids, status: 'planned' } : m), audit: audit(`Équipe de ${ids.length} employé${ids.length > 1 ? 's' : ''} affectée à la mission.`, missionId) });
      return ok(undefined);
    },
    rescheduleMission(missionId, date, startTime, endTime) {
      const mission = editableMission(missionId); if (!mission) return fail('Seules les missions à assigner ou planifiées peuvent être replanifiées.');
      const slot = validateSlot(date, startTime, endTime); if (slot) return fail(slot);
      const duration = get().offers.find(o => o.id === mission.offerId)?.durationHours;
      if (duration && (timeMinutes(endTime)! - timeMinutes(startTime)!) / 60 < duration) return fail('Le nouveau créneau doit couvrir la durée prévue dans l’offre.');
      const candidate = { ...mission, date, startTime, endTime };
      for (const employeeId of assignedEmployees(candidate)) if (employeeConflict(get().missions, employeeId, candidate)) return fail('Un membre de l’équipe a déjà une mission sur ce créneau.');
      set({ missions: get().missions.map(m => m.id === missionId ? candidate : m), audit: audit('Créneau de la mission modifié.', missionId) });
      return ok(undefined);
    },
    cancelMission(missionId) {
      if (!editableMission(missionId)) return fail('Une mission en cours ou terminée ne peut pas être annulée ici.');
      set({ missions: get().missions.map(m => m.id === missionId ? { ...m, status: 'cancelled' } : m), audit: audit('Mission annulée; historique conservé.', missionId) });
      return ok(undefined);
    },
    createEmployee(input) {
      const error = validateEmployee(input); if (error) return fail(error);
      const normalized = normalizeEmployee(input);
      if (get().employees.some(e => e.email.toLowerCase() === normalized.email)) return fail('Ce courriel est déjà utilisé par un employé.');
      const employee: AdminEmployee = { ...normalized, id: id('EMP'), active: true, activationPending: true, createdAt: new Date().toISOString() };
      set({ employees: [employee, ...get().employees], audit: audit('Fiche employé créée en démonstration; invitation non transmise.', employee.id) });
      return ok(employee);
    },
    updateEmployee(employeeId, input) {
      const error = validateEmployee(input); if (error) return fail(error);
      if (!get().employees.some(e => e.id === employeeId)) return fail('Cet employé est introuvable.');
      const normalized = normalizeEmployee(input);
      if (get().employees.some(e => e.id !== employeeId && e.email.toLowerCase() === normalized.email)) return fail('Ce courriel est déjà utilisé par un employé.');
      set({ employees: get().employees.map(e => e.id === employeeId ? { ...e, ...normalized } : e), audit: audit('Coordonnées employé mises à jour.', employeeId) });
      return ok(undefined);
    },
    setEmployeeActive(employeeId, active) {
      if (!get().employees.some(e => e.id === employeeId)) return fail('Cet employé est introuvable.');
      set({ employees: get().employees.map(e => e.id === employeeId ? { ...e, active } : e), audit: audit(active ? 'Employé réactivé dans la démonstration.' : 'Employé suspendu dans la démonstration; historique conservé.', employeeId) });
      return ok(undefined);
    },
    updateService(serviceId, values) {
      if (!values.name.trim() || values.name.trim().length > 100 || values.description.length > 1000) return fail('Renseignez un nom de service de 1 à 100 caractères et une description de 1 000 caractères maximum.');
      if (!get().services.some(s => s.id === serviceId)) return fail('Ce service est introuvable.');
      set({ services: get().services.map(s => s.id === serviceId ? { ...s, ...values, name: values.name.trim(), description: values.description.trim() } : s), audit: audit('Service mis à jour dans le catalogue de démonstration.', serviceId) });
      return ok(undefined);
    },
    updateSettings(values) {
      if (!values.companyName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail.trim())) return fail('Le nom de l’entreprise et un courriel valide sont obligatoires.');
      if (values.contactPhone.trim() && !/^\d{7,15}$/.test(values.contactPhone.replace(/\D/g, ''))) return fail('Le téléphone doit contenir de 7 à 15 chiffres.');
      if (!Number.isFinite(values.defaultTaxPercent) || values.defaultTaxPercent < 0 || values.defaultTaxPercent > 30) return fail('Le taux de taxes doit être compris entre 0 et 30 %.');
      if (!Number.isInteger(values.defaultValidityHours) || values.defaultValidityHours < 1 || values.defaultValidityHours > 720) return fail('La validité doit être de 1 à 720 heures.');
      set({ settings: { ...values, companyName: values.companyName.trim(), contactEmail: values.contactEmail.trim().toLowerCase(), contactPhone: values.contactPhone.trim() }, audit: audit('Paramètres administratifs mis à jour dans la démonstration.') });
      return ok(undefined);
    },
  };
});

// Admin demo state follows the existing authenticated identity without changing the auth module.
useAuthStore.subscribe((state, previous) => {
  const owner = state.session?.user.role === 'ADMIN' ? state.session.user.id : null;
  const oldOwner = previous.session?.user.role === 'ADMIN' ? previous.session.user.id : null;
  if (owner !== oldOwner) useAdminStore.getState().bindOwner(owner);
});
