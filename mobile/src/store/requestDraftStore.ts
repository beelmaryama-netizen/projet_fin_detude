import { create } from 'zustand';
import { emptyResidentialDetails, emptyRequestPreferences, type RequestPreferences, MAX_REQUEST_PHOTOS, type RequestCategory, type RequestPhoto, type ResidentialDetails } from '../features/requests/types/request';

interface RequestDraftState {
  ownerId: string | null;
  category: RequestCategory | null;
  residential: ResidentialDetails;
  photos: RequestPhoto[];
  preferences: RequestPreferences;
  updatePreferences: (details: Partial<RequestPreferences>) => void;
  bindOwner: (ownerId: string | null) => void;
  setCategory: (category: RequestCategory) => void;
  updateResidential: (details: Partial<ResidentialDetails>) => void;
  addPhotos: (photos: RequestPhoto[]) => number;
  removePhoto: (id: string) => void;
  reset: () => void;
}
const emptyDraft = () => ({ category: null, residential: emptyResidentialDetails(), photos: [], preferences: emptyRequestPreferences() });

/** Session-scoped draft: survives screen unmounts, never crosses account boundaries. */
export const useRequestDraftStore = create<RequestDraftState>((set, get) => ({
  ownerId: null, ...emptyDraft(),
  bindOwner: ownerId => { if (get().ownerId !== ownerId) set({ ownerId, ...emptyDraft() }); },
  setCategory: category => set({ category }),
  updateResidential: details => set(state => ({ residential: { ...state.residential, ...details } })),
  updatePreferences: details => set(state => ({ preferences: { ...state.preferences, ...details } })),
  addPhotos: photos => {
    const existing = get().photos;
    const unique = photos.filter((photo, index, list) => !existing.some(item => item.uri === photo.uri)
      && list.findIndex(item => item.uri === photo.uri) === index);
    const accepted = unique.slice(0, Math.max(0, MAX_REQUEST_PHOTOS - existing.length));
    set({ photos: [...existing, ...accepted] });
    return accepted.length;
  },
  removePhoto: id => set(state => ({ photos: state.photos.filter(photo => photo.id !== id) })),
  reset: () => set(emptyDraft()),
}));
