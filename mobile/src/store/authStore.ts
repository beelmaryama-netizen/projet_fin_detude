import { create } from 'zustand';
import type { Session } from '../types/identity';
import { useRequestDraftStore } from './requestDraftStore';
import { useEmployeeStore } from '../features/employee/hooks/useEmployeeStore';
import { useAdminStore } from '../features/employer/store/adminStore';

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
    useEmployeeStore.getState().bindOwner(session.user.role === 'EMPLOYEE' ? session.user : null);
    useAdminStore.getState().bindOwner(session.user.role === 'ADMIN' ? session.user.id : null);
    set({ session });
  },
  clearSession: () => {
    useEmployeeStore.getState().bindOwner(null);
    useAdminStore.getState().bindOwner(null);
    useRequestDraftStore.getState().bindOwner(null);
    useRequestDraftStore.getState().reset();
    set({ session: null });
  },
}));
