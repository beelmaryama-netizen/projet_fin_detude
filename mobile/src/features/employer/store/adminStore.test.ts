import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../../../store/authStore';
import type { Session } from '../../../types/identity';
import type { AdminMission, AdminResult, EmployeeInput, EstimateInput } from '../types/admin';
import { assignedEmployees, useAdminStore } from './adminStore';

const state = () => useAdminStore.getState();
let testOwner = 0;

function unwrap<T>(result: AdminResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

function estimate(overrides: Partial<EstimateInput> = {}): EstimateInput {
  return {
    requestId: 'demo-request-001', durationHours: 3, employeeCount: 1,
    subtotal: '180,00', taxPercent: '14,975', date: '2030-02-15',
    startTime: '09:00', endTime: '12:00', validityHours: 48, notes: 'Produits inclus.',
    ...overrides,
  };
}

function createAcceptedMission(overrides: Partial<EstimateInput> = {}) {
  const offer = unwrap(state().saveEstimate(estimate(overrides)));
  unwrap(state().sendOffer(offer.id));
  unwrap(state().resolveOffer(offer.id, 'accepted'));
  const mission = state().missions.find(item => item.offerId === offer.id);
  if (!mission) throw new Error('Acceptance must create a mission.');
  return { offer, mission };
}

function employee(overrides: Partial<EmployeeInput> = {}): EmployeeInput {
  return {
    firstName: 'Meryem', lastName: 'Alaoui', email: 'meryem@example.ca', phone: '5145550199',
    city: 'Montréal', specialties: ['Résidentiel'], availability: 'En semaine', ...overrides,
  };
}

function adminSession(id: string, role: Session['user']['role'] = 'ADMIN'): Session {
  return {
    user: { id, firstName: 'Alex', lastName: 'Martin', email: `${id}@example.ca`, role },
    accessToken: 'mock', refreshToken: 'mock', expiresAt: Date.now() + 3600_000,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2030-02-10T12:00:00Z'));
  useAuthStore.getState().clearSession();
  state().bindOwner(`admin-test-${++testOwner}`);
});

afterEach(() => {
  useAuthStore.getState().clearSession();
  state().bindOwner(null);
  vi.useRealTimers();
});

describe('administrative estimates and offer lifecycle', () => {
  it.each([
    ['180,00', 18000, 2696, 20696],
    ['19.99', 1999, 299, 2298],
    ['0,10', 10, 1, 11],
  ])('calculates CAD cents and rounded taxes for %s', (subtotal, subtotalCents, taxCents, totalCents) => {
    const offer = unwrap(state().saveEstimate(estimate({ subtotal })));
    expect(offer).toMatchObject({ subtotalCents, taxCents, totalCents, taxPercent: 14.975 });
    expect(Number.isInteger(offer.totalCents)).toBe(true);
    expect(state().requests.find(item => item.id === offer.requestId)?.status).toBe('review');
  });

  it.each<[string, Partial<EstimateInput>]>([
    ['negative money', { subtotal: '-1' }], ['zero money', { subtotal: '0' }],
    ['fraction of a cent', { subtotal: '12,345' }], ['ambiguous money', { subtotal: '1,2.3' }],
    ['nondecimal money', { subtotal: '1e3' }], ['blank money', { subtotal: '' }],
    ['excessive money', { subtotal: '100000.01' }], ['invalid tax', { taxPercent: 'abc' }],
    ['negative tax', { taxPercent: '-1' }], ['excessive tax', { taxPercent: '30.001' }],
    ['impossible date', { date: '2030-02-30' }], ['past date', { date: '2030-02-09' }],
    ['short date', { date: '2030-2-15' }], ['invalid start', { startTime: '24:00' }],
    ['short start', { startTime: '9:00' }], ['invalid minutes', { endTime: '12:60' }],
    ['reversed slot', { endTime: '08:00' }], ['zero-length slot', { endTime: '09:00' }],
    ['insufficient slot', { durationHours: 4 }], ['too-short duration', { durationHours: 0.1 }],
    ['nonfinite duration', { durationHours: Number.NaN }], ['zero staff', { employeeCount: 0 }],
    ['fractional staff', { employeeCount: 1.5 }], ['too many staff', { employeeCount: 21 }],
    ['nonfinite staff', { employeeCount: Number.NaN }], ['zero validity', { validityHours: 0 }],
    ['fractional validity', { validityHours: 1.5 }], ['excessive validity', { validityHours: 721 }],
  ])('rejects %s without creating or updating an offer', (_description, patch) => {
    const before = state().offers;
    expect(state().saveEstimate(estimate(patch)).ok).toBe(false);
    expect(state().offers).toBe(before);
    expect(state().requests.find(item => item.id === 'demo-request-001')?.status).toBe('new');
  });

  it('edits one draft without duplication, preserving its reference and creation time', () => {
    const original = unwrap(state().saveEstimate(estimate()));
    const count = state().offers.length;
    vi.advanceTimersByTime(60_000);
    const revised = unwrap(state().saveEstimate(estimate({ offerId: original.id, subtotal: '250,00', notes: '  Nouveau montant  ' })));
    expect(revised).toMatchObject({ id: original.id, createdAt: original.createdAt, subtotalCents: 25000, notes: 'Nouveau montant', status: 'draft' });
    expect(state().offers).toHaveLength(count);
  });

  it('reuses an existing request draft even when the caller omits its offer reference', () => {
    const first = unwrap(state().saveEstimate(estimate()));
    const second = unwrap(state().saveEstimate(estimate({ subtotal: '210' })));
    expect(second.id).toBe(first.id);
    expect(state().offers.filter(item => item.requestId === first.requestId)).toHaveLength(1);
  });

  it('rejects a draft reference belonging to another request or an unknown request', () => {
    const original = unwrap(state().saveEstimate(estimate()));
    expect(state().saveEstimate(estimate({ requestId: 'demo-request-002', offerId: original.id })).ok).toBe(false);
    expect(state().saveEstimate(estimate({ requestId: 'missing' })).ok).toBe(false);
  });

  it('sends only a draft, fixes its deadline and prevents modifications or duplicate transmission', () => {
    const original = unwrap(state().saveEstimate(estimate()));
    const sent = unwrap(state().sendOffer(original.id));
    expect(sent.status).toBe('sent');
    expect(Date.parse(sent.validUntil!) - Date.parse(sent.sentAt!)).toBe(48 * 3600_000);
    expect(state().requests.find(item => item.id === sent.requestId)?.status).toBe('offer-sent');
    expect(state().sendOffer(original.id).ok).toBe(false);
    expect(state().saveEstimate(estimate({ offerId: original.id, subtotal: '10' })).ok).toBe(false);
    expect(state().saveEstimate(estimate()).ok).toBe(false);
    expect(state().offers.find(item => item.id === original.id)).toEqual(sent);
  });

  it('creates exactly one unassigned mission when a sent offer is accepted', () => {
    const original = unwrap(state().saveEstimate(estimate({ employeeCount: 2 })));
    unwrap(state().sendOffer(original.id));
    const before = state().missions.length;
    unwrap(state().resolveOffer(original.id, 'accepted'));
    expect(state().missions).toHaveLength(before + 1);
    expect(state().missions.find(item => item.offerId === original.id)).toMatchObject({ requestId: original.requestId, status: 'unassigned', employeeIds: [] });
    expect(state().requests.find(item => item.id === original.requestId)?.status).toBe('confirmed');
    expect(state().resolveOffer(original.id, 'accepted').ok).toBe(false);
    expect(state().resolveOffer(original.id, 'refused').ok).toBe(false);
    expect(state().missions.filter(item => item.offerId === original.id)).toHaveLength(1);
  });

  it('refuses an offer without creating a mission and allows preparing another estimate', () => {
    const original = unwrap(state().saveEstimate(estimate()));
    unwrap(state().sendOffer(original.id));
    const before = state().missions;
    unwrap(state().resolveOffer(original.id, 'refused'));
    expect(state().missions).toBe(before);
    expect(state().requests.find(item => item.id === original.requestId)?.status).toBe('waiting');
    expect(state().saveEstimate(estimate()).ok).toBe(true);
  });

  it('rejects an expired response, preserves the offer record and releases the request for a new estimate', () => {
    const original = unwrap(state().saveEstimate(estimate({ validityHours: 1 })));
    unwrap(state().sendOffer(original.id));
    const before = state().missions.length;
    vi.advanceTimersByTime(3600_000);
    expect(state().resolveOffer(original.id, 'accepted').ok).toBe(false);
    expect(state().offers.find(item => item.id === original.id)?.status).toBe('expired');
    expect(state().requests.find(item => item.id === original.requestId)?.status).toBe('waiting');
    expect(state().missions).toHaveLength(before);
    expect(state().saveEstimate(estimate()).ok).toBe(true);
  });

  it('allows a replacement estimate after a deadline passes without simulating an expired client response first', () => {
    const original = unwrap(state().saveEstimate(estimate({ validityHours: 1 })));
    unwrap(state().sendOffer(original.id));
    vi.advanceTimersByTime(3600_000);
    const replacement = unwrap(state().saveEstimate(estimate({ subtotal: '200' })));
    expect(replacement.id).not.toBe(original.id);
    expect(replacement.status).toBe('draft');
    expect(state().offers.find(item => item.id === original.id)?.status).toBe('expired');
  });

  it('cancels a sent offer while preserving its amount, history and the mission list', () => {
    const original = unwrap(state().saveEstimate(estimate()));
    const sent = unwrap(state().sendOffer(original.id));
    const beforeCount = state().offers.length;
    const beforeMissions = state().missions;
    expect(state().cancelOffer(original.id).ok).toBe(true);
    expect(state().offers).toHaveLength(beforeCount);
    expect(state().offers.find(item => item.id === original.id)).toEqual({ ...sent, status: 'cancelled' });
    expect(state().missions).toBe(beforeMissions);
    expect(state().resolveOffer(original.id, 'accepted').ok).toBe(false);
    expect(state().sendOffer(original.id).ok).toBe(false);
    expect(state().audit.some(item => item.entityId === original.id)).toBe(true);
  });
});

describe('assignment and mission scheduling', () => {
  it('requires the complete quoted team and rejects duplicate employees before planning', () => {
    const { mission } = createAcceptedMission({ employeeCount: 2 });
    expect(state().setMissionEmployees(mission.id, []).ok).toBe(false);
    expect(state().setMissionEmployees(mission.id, ['EMP-001']).ok).toBe(false);
    expect(state().setMissionEmployees(mission.id, ['EMP-001', 'EMP-001']).ok).toBe(false);
    expect(state().missions.find(item => item.id === mission.id)?.status).toBe('unassigned');
    expect(state().setMissionEmployees(mission.id, ['EMP-001', 'EMP-002']).ok).toBe(true);
    const planned = state().missions.find(item => item.id === mission.id)!;
    expect(planned.status).toBe('planned');
    expect(assignedEmployees(planned)).toEqual(['EMP-001', 'EMP-002']);
  });

  it('rejects a suspended or unknown employee without changing the mission', () => {
    const { mission } = createAcceptedMission();
    expect(state().assignMission(mission.id, 'EMP-004').ok).toBe(false);
    expect(state().assignMission(mission.id, 'missing').ok).toBe(false);
    expect(state().missions.find(item => item.id === mission.id)).toEqual(mission);
  });

  it('detects an overlapping assignment and permits a mission starting exactly at the previous end', () => {
    const { mission } = createAcceptedMission();
    const blocker: AdminMission = {
      id: 'test-blocker', requestId: mission.requestId, status: 'planned',
      employeeId: 'EMP-001', employeeIds: ['EMP-001'], date: mission.date,
      startTime: '08:00', endTime: '10:00', checklist: [], notes: '',
    };
    useAdminStore.setState({ missions: [...state().missions, blocker] });
    expect(state().assignMission(mission.id, 'EMP-001').ok).toBe(false);
    expect(state().rescheduleMission(mission.id, mission.date, '10:00', '13:00').ok).toBe(true);
    expect(state().assignMission(mission.id, 'EMP-001').ok).toBe(true);
  });

  it.each(['cancelled', 'completed'] as const)('does not reserve staff for a %s mission', status => {
    const { mission } = createAcceptedMission();
    const blocker: AdminMission = {
      id: 'test-history', requestId: mission.requestId, status,
      employeeIds: ['EMP-001'], date: mission.date, startTime: '09:00', endTime: '12:00', checklist: [], notes: '',
    };
    useAdminStore.setState({ missions: [...state().missions, blocker] });
    expect(state().assignMission(mission.id, 'EMP-001').ok).toBe(true);
  });

  it('checks every team member when rescheduling and preserves the original slot on conflict', () => {
    const { mission } = createAcceptedMission({ employeeCount: 2 });
    unwrap(state().setMissionEmployees(mission.id, ['EMP-001', 'EMP-002']));
    const blocker: AdminMission = {
      id: 'test-second-member', requestId: mission.requestId, status: 'planned',
      employeeIds: ['EMP-002'], date: '2030-02-16', startTime: '09:00', endTime: '11:00', checklist: [], notes: '',
    };
    useAdminStore.setState({ missions: [...state().missions, blocker] });
    expect(state().rescheduleMission(mission.id, blocker.date, '10:00', '13:00').ok).toBe(false);
    expect(state().missions.find(item => item.id === mission.id)?.date).toBe(mission.date);
    expect(state().rescheduleMission(mission.id, blocker.date, '11:00', '14:00').ok).toBe(true);
  });

  it('retains assignment and history when cancelling and prevents further scheduling edits', () => {
    const { mission } = createAcceptedMission();
    unwrap(state().assignMission(mission.id, 'EMP-001'));
    const planned = state().missions.find(item => item.id === mission.id)!;
    const count = state().missions.length;
    unwrap(state().cancelMission(mission.id));
    expect(state().missions).toHaveLength(count);
    expect(state().missions.find(item => item.id === mission.id)).toEqual({ ...planned, status: 'cancelled' });
    expect(state().assignMission(mission.id, 'EMP-002').ok).toBe(false);
    expect(state().rescheduleMission(mission.id, '2030-02-16', '09:00', '12:00').ok).toBe(false);
    expect(state().cancelMission(mission.id).ok).toBe(false);
  });

  it.each(['MIS-003', 'MIS-004'])('protects in-progress and completed mission %s from administrative edits', missionId => {
    const original = state().missions.find(item => item.id === missionId)!;
    expect(state().assignMission(missionId, 'EMP-003').ok).toBe(false);
    expect(state().rescheduleMission(missionId, '2030-02-16', '09:00', '12:00').ok).toBe(false);
    expect(state().cancelMission(missionId).ok).toBe(false);
    expect(state().missions.find(item => item.id === missionId)).toBe(original);
  });
});

describe('employees, settings and administrative identity', () => {
  it('normalizes employee coordinates and rejects duplicate emails regardless of case or whitespace', () => {
    const added = unwrap(state().createEmployee(employee({ firstName: ' Meryem ', email: ' Meryem@Example.CA ', specialties: ['Résidentiel', 'Résidentiel', ''] })));
    expect(added).toMatchObject({ firstName: 'Meryem', email: 'meryem@example.ca', specialties: ['Résidentiel'], activationPending: true, active: true });
    expect(state().createEmployee(employee({ email: 'MERYEM@EXAMPLE.CA' })).ok).toBe(false);
    expect(state().updateEmployee('EMP-002', employee({ email: ' SARAH@MAGICPRO.EXAMPLE ' })).ok).toBe(false);
  });

  it('preserves mission history when an employee is suspended and allows later reactivation', () => {
    const before = state().missions;
    unwrap(state().setEmployeeActive('EMP-001', false));
    expect(state().employees.find(item => item.id === 'EMP-001')?.active).toBe(false);
    expect(state().missions).toBe(before);
    unwrap(state().setEmployeeActive('EMP-001', true));
    expect(state().employees.find(item => item.id === 'EMP-001')?.active).toBe(true);
  });

  it.each([
    { companyName: '' }, { contactEmail: 'bad-address' }, { contactPhone: '12' },
    { defaultTaxPercent: Number.NaN }, { defaultTaxPercent: -1 }, { defaultTaxPercent: 30.001 },
    { defaultValidityHours: 0 }, { defaultValidityHours: 1.5 }, { defaultValidityHours: 721 },
  ])('rejects invalid administrative settings %o without updating defaults', patch => {
    const before = state().settings;
    expect(state().updateSettings({ ...before, ...patch }).ok).toBe(false);
    expect(state().settings).toBe(before);
  });

  it('saves normalized settings that new estimation forms can read', () => {
    const result = state().updateSettings({ ...state().settings, companyName: ' MagiquePro Plus ', contactEmail: ' ADMIN@EXAMPLE.CA ', defaultTaxPercent: 5, defaultValidityHours: 24 });
    expect(result.ok).toBe(true);
    expect(state().settings).toMatchObject({ companyName: 'MagiquePro Plus', contactEmail: 'admin@example.ca', defaultTaxPercent: 5, defaultValidityHours: 24 });
  });

  it('retains edits for the same owner and resets private session data on a different owner', () => {
    const owner = state().ownerId;
    const draft = unwrap(state().saveEstimate(estimate()));
    const added = unwrap(state().createEmployee(employee()));
    unwrap(state().updateSettings({ ...state().settings, companyName: 'Private company' }));
    state().bindOwner(owner);
    expect(state().offers.some(item => item.id === draft.id)).toBe(true);
    state().bindOwner('different-admin');
    expect(state().offers.some(item => item.id === draft.id)).toBe(false);
    expect(state().employees.some(item => item.id === added.id)).toBe(false);
    expect(state().settings.companyName).toBe('MagiquePro');
    expect(state().audit).toHaveLength(1);
  });

  it('follows authenticated administrator changes, role changes and logout without leaking edits', () => {
    useAuthStore.getState().setSession(adminSession('admin-a'));
    const draftA = unwrap(state().saveEstimate(estimate()));
    useAuthStore.getState().setSession(adminSession('admin-a'));
    expect(state().offers.some(item => item.id === draftA.id)).toBe(true);
    useAuthStore.getState().setSession(adminSession('admin-b'));
    expect(state().ownerId).toBe('admin-b');
    expect(state().offers.some(item => item.id === draftA.id)).toBe(false);
    const draftB = unwrap(state().saveEstimate(estimate()));
    useAuthStore.getState().setSession(adminSession('employee-a', 'EMPLOYEE'));
    expect(state().ownerId).toBeNull();
    expect(state().offers.some(item => item.id === draftB.id)).toBe(false);
    useAuthStore.getState().setSession(adminSession('admin-c'));
    const draftC = unwrap(state().saveEstimate(estimate()));
    useAuthStore.getState().clearSession();
    expect(state().ownerId).toBeNull();
    expect(state().offers.some(item => item.id === draftC.id)).toBe(false);
  });
});
