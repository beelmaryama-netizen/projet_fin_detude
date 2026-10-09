import { useMemo, useState } from 'react';
import { useSession } from '../../auth/hooks/useSession';
import { filterEmployerRequests, getEmployerRequests, getEmployerSummary } from '../services/mockEmployerService';
import type { EmployerRequestFilter } from '../types/employer';

export function useEmployerDashboard() {
  const session = useSession();
  const [filter, setFilter] = useState<EmployerRequestFilter>('all');
  const requests = useMemo(() => getEmployerRequests(), [session.session?.user.id]);
  const summary = useMemo(() => getEmployerSummary(requests), [requests]);
  const visibleRequests = useMemo(() => filterEmployerRequests(requests, filter), [requests, filter]);
  return { ...session, requests, summary, visibleRequests, filter, setFilter };
}
