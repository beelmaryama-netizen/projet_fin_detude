import { emptyBusinessDetails, type BusinessDetails, type RequestDocument } from '../features/requests/types/business';
import { create } from 'zustand';
import { emptyResidentialDetails, MAX_REQUEST_PHOTOS, type RequestCategory, type RequestPhoto, type ResidentialDetails } from '../features/requests/types/request';
import { emptySchedule, type SchedulePreferences } from '../features/requests/types/request';

interface RequestDraftState {
  categoryDrafts: Partial<Record<RequestCategory, { business: BusinessDetails; documents: RequestDocument[]; photos: RequestPhoto[]; schedule: SchedulePreferences }>>;
  ownerId: string | null;
  category: RequestCategory | null;
  residential: ResidentialDetails;
  business: BusinessDetails; documents: RequestDocument[];
  updateBusiness: (details: Partial<BusinessDetails>) => void;
  setDocuments: (documents: RequestDocument[]) => void;
  photos: RequestPhoto[];
  schedule: SchedulePreferences;
  submissionKey: string;
  updateSchedule: (schedule: SchedulePreferences) => void;
  bindOwner: (ownerId: string | null) => void;
  setCategory: (category: RequestCategory) => void;
  updateResidential: (details: Partial<ResidentialDetails>) => void;
  addPhotos: (photos: RequestPhoto[]) => number;
  removePhoto: (id: string) => void;
  reset: () => void;
}
let draftSequence = 0;
const emptyDraft = () => ({ category: null, categoryDrafts: {}, residential: emptyResidentialDetails(), business: emptyBusinessDetails(), documents: [], photos: [], schedule: emptySchedule(), submissionKey: `draft-${Date.now()}-${++draftSequence}` });

/** Session-scoped draft: survives screen unmounts, never crosses account boundaries. */
export const useRequestDraftStore = create<RequestDraftState>((set, get) => ({
  ownerId: null, ...emptyDraft(),
  bindOwner: ownerId => { if (get().ownerId !== ownerId) set({ ownerId, ...emptyDraft() }); },
  setCategory: category => set(state => {
    if (category === state.category) return state;
    const categoryDrafts = { ...state.categoryDrafts };
    if (state.category) categoryDrafts[state.category] = { business: state.business, documents: state.documents, photos: state.photos, schedule: state.schedule };
    const restored = categoryDrafts[category] ?? { business: emptyBusinessDetails(), documents: [], photos: [], schedule: emptySchedule() };
    return { category, categoryDrafts, ...restored, submissionKey: `draft-${Date.now()}-${++draftSequence}` };
  }),
  updateBusiness: details => set(state => ({ business: { ...state.business, ...details } })),
  setDocuments: documents => set({ documents }),
  updateSchedule: schedule => set({ schedule }),
  updateResidential: details => set(state => ({ residential: { ...state.residential, ...details } })),
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
