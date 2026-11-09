import { create } from 'zustand';
import type { CompletionReport, MissionPhoto } from '../types/employee';
interface Draft extends CompletionReport { photos: MissionPhoto[] }
interface State { ownerId: string | null; drafts: Record<string, Draft>; bindOwner: (id: string | null) => void; update: (id: string, patch: Partial<Draft>) => void; clear: (id: string) => void }
export const emptyEmployeeDraft = (): Draft => ({ photos: [], note: '', incident: '' });
export const useEmployeeDraftStore = create<State>((set, get) => ({
  ownerId: null, drafts: {},
  bindOwner: ownerId => { if (get().ownerId !== ownerId) set({ ownerId, drafts: {} }); },
  update: (id, patch) => set(state => ({ drafts: { ...state.drafts, [id]: { ...emptyEmployeeDraft(), ...state.drafts[id], ...patch } } })),
  clear: id => set(state => { const drafts = { ...state.drafts }; delete drafts[id]; return { drafts }; }),
}));
