import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useSupportStore, type SupportTicket } from '../../store/supportStore';
import { apiMode } from './config';
import { request } from './transport';
export function useSupportTickets() {
 const id = useAuthStore(s => s.session?.user.id);
 const local = useSupportStore(s => s.tickets);
 const query = useQuery({ queryKey: ['support', id], queryFn: () => request<SupportTicket[]>('GET', '/support'), enabled: apiMode && !!id, refetchInterval: apiMode ? 15000 : false });
 return { tickets: apiMode ? query.data ?? [] : local, error: query.error, loading: apiMode && query.isPending, refresh: query.refetch };
}
export async function replyToTicket(id: string, reply: string) {
 if (apiMode) await request('PUT', '/support/' + id + '/reply', { reply }); else useSupportStore.getState().reply(id, reply);
}
