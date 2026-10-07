import { create } from 'zustand';
import type { Session } from '../types/identity';
import { useRequestDraftStore } from './requestDraftStore';

interface AuthState {
  session: Session | null;
  setSession: (session: Session) => void;
  clearSession: () => void;
}
// Mock accounts and sessions are intentionally volatile, never persisted in AsyncStorage.
export const useAuthStore = create<AuthState>(set => ({
  session: null,
  setSession: session => {
    useRequestDraftStore.getState().bindOwner(session.user.role === 'CLIENT' ? session.user.id : null);
    set({ session });
  },
  clearSession: () => {
    useRequestDraftStore.getState().bindOwner(null);
    useRequestDraftStore.getState().reset();
    set({ session: null });
  },
}));
