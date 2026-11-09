import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import type { User } from '../../../types/identity';
import { employeeService } from '../services/employeeService';
export const employeeKey = (id: string) => ['employee', id] as const;
export function useEmployeeUser() {
  const user = useAuthStore(state => state.session?.user);
  if (!user || user.role !== 'EMPLOYEE') throw new Error('Session employé requise.');
  return user;
}
export const employeeError = (error: unknown) => error instanceof Error ? error.message : 'Impossible de terminer cette action.';
export function useEmployeeQuery<T>(key: string, fetch: (user: User) => Promise<T>) {
  const user = useEmployeeUser();
  return useQuery({ queryKey: [...employeeKey(user.id), key], queryFn: () => fetch(user), refetchOnMount: 'always' });
}
export function useEmployeeMission(id: string) { return useEmployeeQuery('mission-' + id, user => employeeService.get(user, id)); }
export function useEmployeeMutation<T, V>(action: (user: User, value: V) => Promise<T>, success?: (result: T) => void) {
  const user = useEmployeeUser(); const cache = useQueryClient(); const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  return useMutation({ mutationFn: (value: V) => action(user, value), onSuccess: async result => {
    if (useAuthStore.getState().session?.user.id !== user.id) return;
    await cache.invalidateQueries({ queryKey: employeeKey(user.id) });
    if (mounted.current && useAuthStore.getState().session?.user.id === user.id) success?.(result);
  } });
}
