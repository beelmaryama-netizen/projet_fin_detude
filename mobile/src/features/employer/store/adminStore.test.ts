import { beforeEach, describe, expect, test } from 'vitest';
import { useAdminStore } from './adminStore';

beforeEach(() => {
  useAdminStore.getState().reset();
});

describe('adminStore', () => {
  test('calcule les taxes et le total en cents', () => {
    const offer = useAdminStore.getState().saveDraft({
      requestId: 'req-test',
      clientId: 'client-1',
      clientName: 'Sophie Tremblay',
      serviceName: 'Grand ménage résidentiel',
      address: '123 rue Sainte-Catherine, Montréal',
      startAt: '2026-10-25T09:00:00',
      endAt: '2026-10-25T12:00:00',
      durationMinutes: 180,
      employeeCount: 2,
      subtotalCents: 20000,
      taxRateBps: 1498,
      validDays: 7,
      notes: '',
      conditions: '',
    });

    expect(offer.taxCents).toBe(2996);
    expect(offer.totalCents).toBe(22996);
    expect(offer.status).toBe('DRAFT');
  });

  test('crée une seule mission après acceptation', () => {
    const store = useAdminStore.getState();
    const before = store.missions.length;
    store.simulateOfferResponse('offer-1', true);
    expect(useAdminStore.getState().missions.length).toBe(before + 1);

    useAdminStore.getState().simulateOfferResponse('offer-1', true);
    expect(useAdminStore.getState().missions.length).toBe(before + 1);
  });

  test('refuse un employé suspendu dans une affectation', () => {
    const result = useAdminStore.getState().assignMission('mission-1', ['emp-1', 'emp-4']);
    expect(result.ok).toBe(false);
    expect(result.message).toContain('suspendu');
  });

  test('empêche les doublons de courriel employé', () => {
    const result = useAdminStore.getState().createEmployee({
      firstName: 'Test',
      lastName: 'Employé',
      email: 'nadia@magicpro.demo',
      phone: '514 555-0000',
      city: 'Montréal',
      specialties: ['Résidentiel'],
      availability: 'Lun–Ven',
    });
    expect(result.ok).toBe(false);
  });

  test('réinitialise les données admin à la déconnexion', () => {
    useAdminStore.getState().toggleEmployeeStatus('emp-1');
    expect(useAdminStore.getState().employees.find(item => item.id === 'emp-1')?.status).toBe('SUSPENDED');
    useAdminStore.getState().bindOwner(null);
    expect(useAdminStore.getState().employees.find(item => item.id === 'emp-1')?.status).toBe('ACTIVE');
  });
});
