import { beforeEach, describe, expect, it } from 'vitest';
import { useRequestDraftStore } from './requestDraftStore';
import { useAuthStore } from './authStore';
import type { Session } from '../types/identity';

const session = (id: string): Session => ({ user: { id, firstName: 'Léa', lastName: 'Martin', email: `${id}@example.ca`, role: 'CLIENT' }, accessToken: 'mock', refreshToken: 'mock', expiresAt: 9999999999999 });
const photo = (id: string) => ({ id, uri: `file:///photo-${id}.jpg`, name: id });
beforeEach(() => useAuthStore.getState().clearSession());
describe('request draft isolation and photos', () => {
  it('retains details when switching categories and renewing the same session', () => {
    useAuthStore.getState().setSession(session('a'));
    const draft = useRequestDraftStore.getState();
    draft.setCategory('RESIDENTIAL');
    draft.updateResidential({ propertyType: 'HOUSE', areaSqft: '1200', hasPets: false });
    draft.updatePreferences({ date: '2027-01-01', timeSlot: 'MORNING', notes: 'Sans parfum' });
    draft.setCategory('COMMERCIAL');
    draft.setCategory('RESIDENTIAL');
    useAuthStore.getState().setSession(session('a'));
    expect(useRequestDraftStore.getState().preferences.notes).toBe('Sans parfum');
    expect(useRequestDraftStore.getState().residential).toMatchObject({ propertyType: 'HOUSE', areaSqft: '1200', hasPets: false });
  });
  it('clears private details and photos on account change and logout', () => {
    useAuthStore.getState().setSession(session('a'));
    useRequestDraftStore.getState().updateResidential({ description: 'Private address details' });
    useRequestDraftStore.getState().updatePreferences({ notes: 'Private preferences' });
    useRequestDraftStore.getState().addPhotos([photo('1')]);
    useAuthStore.getState().setSession(session('b'));
    expect(useRequestDraftStore.getState().residential.description).toBe('');
    expect(useRequestDraftStore.getState().photos).toEqual([]);
    expect(useRequestDraftStore.getState().preferences).toEqual({ date: '', timeSlot: '', notes: '' });
    useRequestDraftStore.getState().setCategory('MEDICAL');
    useRequestDraftStore.getState().updatePreferences({ notes: 'Other private preferences' });
    useAuthStore.getState().clearSession();
    expect(useRequestDraftStore.getState().preferences.notes).toBe('');
    expect(useRequestDraftStore.getState()).toMatchObject({ ownerId: null, category: null, photos: [] });
  });
  it('deduplicates and caps photos at five, then permits replacing a removed photo', () => {
    const draft = useRequestDraftStore.getState();
    expect(draft.addPhotos([photo('1'), photo('1'), photo('2')])).toBe(2);
    expect(draft.addPhotos([photo('2'), ...['3', '4', '5', '6'].map(photo)])).toBe(3);
    expect(useRequestDraftStore.getState().photos).toHaveLength(5);
    draft.removePhoto('3');
    expect(draft.addPhotos([photo('6')])).toBe(1);
    expect(useRequestDraftStore.getState().photos.map(item => item.id)).toEqual(['1', '2', '4', '5', '6']);
  });
});
