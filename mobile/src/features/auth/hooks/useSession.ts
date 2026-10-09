import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { queryClient } from '../../../services/queryClient';
import { authService } from '../services/authService';
import { getAuthError } from './useAuthFlow';

export function useSession() {
  const session = useAuthStore(state => state.session);
  const clearSession = useAuthStore(state => state.clearSession);
  const logout = useMutation({ mutationFn: authService.logout, onSuccess: () => { queryClient.clear(); clearSession(); } });
  return { session, signOut: () => logout.mutate(), busy: logout.isPending, error: getAuthError(logout.error) };
}
