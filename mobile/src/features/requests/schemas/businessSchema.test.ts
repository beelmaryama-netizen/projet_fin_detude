import { businessProfiles } from '../data/businessProfiles';
import { describe, expect, it } from 'vitest';
import { businessDetailsSchema, requestDocumentsSchema } from './businessSchema';
import { requestSubmissionSchema } from './scheduleSchema';
import { emptyBusinessDetails, MAX_DOCUMENT_BYTES } from '../types/business';
import { createMockClientServices } from '../../client/services/mockClientService';
import { useRequestDraftStore } from '../../../store/requestDraftStore';
import type { User } from '../../../types/identity';

const business = { ...emptyBusinessDetails(), establishmentType: 'Bureau' as const, companyName: 'Entreprise Démo', areaSqft: '15000', siteAddress: '123 rue Exemple, Montréal QC', zones: ['Bureaux' as const], description: 'Nettoyage des espaces et planchers', frequency: 'Hebdomadaire' as const };
const common = { photos: [], documents: [], business, submissionKey: 'business-demo', schedule: { availabilities: [{ date: '2099-01-01', slot: 'MORNING' as const }], instructions: '', accessNotes: '', addressId: '' } };
const user: User = { id: 'professional', role: 'CLIENT', email: 'pro@example.ca', firstName: 'Léa', lastName: 'Martin' };
describe('professional requests', () => {
  it.each(['COMMERCIAL', 'INDUSTRIAL', 'MEDICAL'] as const)('rejects incompatible establishment and zones for %s', category => {
    const profile = businessProfiles[category];
    const valid = { ...common, category, business: { ...business, establishmentType: profile.establishments[0]!, zones: [profile.zones[0]!] } };
    expect(requestSubmissionSchema.safeParse(valid).success).toBe(true);
    const incompatible = category === 'INDUSTRIAL' ? 'Clinique' : 'Usine';
    expect(requestSubmissionSchema.safeParse({ ...valid, business: { ...valid.business, establishmentType: incompatible } }).success).toBe(false);
    const zone = category === 'INDUSTRIAL' ? 'Salles de consultation' : 'Production';
    expect(requestSubmissionSchema.safeParse({ ...valid, business: { ...valid.business, zones: [zone] } }).success).toBe(false);
  });
  it('keeps separate category drafts without leaking choices or attachments', () => {
    const store = useRequestDraftStore.getState(); store.reset(); store.setCategory('INDUSTRIAL');
    store.updateBusiness({ establishmentType: 'Usine', zones: ['Production'], constraints: 'Consigne usine' });
    store.addPhotos([{ id: 'industrial', uri: 'file:///industrial.jpg', name: 'Usine' }]);
    store.setCategory('MEDICAL');
    expect(useRequestDraftStore.getState()).toMatchObject({ business: emptyBusinessDetails(), photos: [] });
    store.updateBusiness({ establishmentType: 'Clinique', zones: ['Salle d’attente'] });
    store.setCategory('INDUSTRIAL');
    expect(useRequestDraftStore.getState().business).toMatchObject({ establishmentType: 'Usine', zones: ['Production'] });
    expect(useRequestDraftStore.getState().photos).toHaveLength(1);
    store.setCategory('MEDICAL');
    expect(useRequestDraftStore.getState().business).toMatchObject({ establishmentType: 'Clinique', zones: ['Salle d’attente'], constraints: '' });
    store.reset(); expect(useRequestDraftStore.getState().categoryDrafts).toEqual({});
  });
  it.each(['COMMERCIAL', 'INDUSTRIAL', 'MEDICAL'] as const)('creates and retrieves %s without residential data or automatic reservation', async category => {
    const api = createMockClientServices({ latency: 0 });
    const profile = businessProfiles[category];
    const specificBusiness = { ...business, establishmentType: profile.establishments[0]!, zones: [profile.zones[0]!] };
    const input = { ...common, business: specificBusiness, category };
    const parsed = requestSubmissionSchema.parse({ ...input, residential: { description: 'Must not leak' } });
    expect(parsed).not.toHaveProperty('residential');
    const result = await api.requests.create(user, parsed);
    expect(result).toMatchObject({ category, status: 'NEW', business: specificBusiness });
    expect(await api.requests.get(user, result.id)).toEqual(result);
    expect((await api.requests.create(user, input)).id).toBe(result.id);
    expect(await api.reservations.list(user)).toEqual([]);
  });
  it('requires site details, at least one zone and custom frequency text', () => {
    expect(businessDetailsSchema.safeParse(emptyBusinessDetails()).success).toBe(false);
    for (const patch of [{ zones: [] }, { areaSqft: '-4' }, { siteAddress: '' }, { frequency: 'Personnalisé', customFrequency: ' ' }, { floors: 0 }]) {
      expect(businessDetailsSchema.safeParse({ ...business, ...patch }).success).toBe(false);
    }
    expect(businessDetailsSchema.safeParse({ ...business, frequency: 'Personnalisé', customFrequency: 'Deux fois par mois' }).success).toBe(true);
  });
  it('limits document types, size and count', () => {
    const pdf = { id: 'pdf', uri: 'file:///plan.pdf', name: 'plan.pdf', size: 1234, mimeType: 'application/pdf' };
    expect(requestDocumentsSchema.safeParse([pdf]).success).toBe(true);
    for (const values of [[{ ...pdf, size: MAX_DOCUMENT_BYTES + 1 }], [{ ...pdf, mimeType: 'text/plain' }], Array.from({ length: 6 }, () => pdf)]) expect(requestDocumentsSchema.safeParse(values).success).toBe(false);
  });
  it('preserves business details between steps and clears them on account change', () => {
    const store = useRequestDraftStore.getState(); store.bindOwner('professional'); store.setCategory('MEDICAL'); store.updateBusiness(business);
    expect(useRequestDraftStore.getState().business).toEqual(business);
    store.bindOwner('another-client');
    expect(useRequestDraftStore.getState()).toMatchObject({ category: null, business: emptyBusinessDetails(), documents: [] });
  });
});
