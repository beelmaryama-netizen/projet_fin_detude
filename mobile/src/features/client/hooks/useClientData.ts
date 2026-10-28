import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../../store/authStore';
import type { User } from '../../../types/identity';
import { ClientServiceError } from '../types/client';
export function useClientUser() {
  const user = useAuthStore(state => state.session?.user);
  if (!user || user.role !== 'CLIENT') throw new Error('Une session client est requise.');
  return user;
}
export const clientKey = (id: string) => ['client', id] as const;
export const errorMessage = (error: unknown) => error instanceof ClientServiceError ? error.message : error instanceof Error && error.name === 'AuthError' ? error.message : 'Impossible de terminer cette action. Réessayez.';
export function useClientQuery<T>(key: string, fetch: (user: User) => Promise<T>) {
  const user = useClientUser();
  return useQuery({ queryKey: [...clientKey(user.id), key], queryFn: () => fetch(user), refetchOnMount: 'always' });
}
export function useClientMutation<T, V>(action: (user: User, variables: V) => Promise<T>, onSuccess?: (value: T) => void) {
  const user = useClientUser(); const cache = useQueryClient();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  return useMutation({ mutationFn: (variables: V) => action(user, variables),
    onSuccess: async result => {
      if (useAuthStore.getState().session?.user.id !== user.id) return;
      await cache.invalidateQueries({ queryKey: clientKey(user.id) });
      if (mounted.current && useAuthStore.getState().session?.user.id === user.id) onSuccess?.(result);
    },
  });
}
