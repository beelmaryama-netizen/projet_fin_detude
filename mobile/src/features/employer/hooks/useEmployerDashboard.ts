import { useEffect, useMemo, useState } from 'react';
import { useSession } from '../../auth/hooks/useSession';
import { filterEmployerRequests, getEmployerSummary } from '../services/mockEmployerService';
import { useAdminStore } from '../store/adminStore';
import type { EmployerRequestFilter } from '../types/employer';

export function useEmployerDashboard() {
  const session = useSession();
  const [filter, setFilter] = useState<EmployerRequestFilter>('all');
  const requests = useAdminStore(state => state.requests);
  const bindOwner = useAdminStore(state => state.bindOwner);
  useEffect(() => { bindOwner(session.session?.user.role === 'ADMIN' ? session.session.user.id : null); }, [bindOwner, session.session?.user.id, session.session?.user.role]);
  const summary = useMemo(() => getEmployerSummary(requests), [requests]);
  const visibleRequests = useMemo(() => filterEmployerRequests(requests, filter), [requests, filter]);
  return { ...session, requests, summary, visibleRequests, filter, setFilter };
}
