import type { AdminData } from '../types/admin';
import type { EmployerRequest } from '../types/employer';
import { getEmployerMetrics, type EmployerPeriod } from './employerAnalytics';
import { localDate } from './adminHelpers';

export function adminPeriodBounds(period: EmployerPeriod, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  if (period === 'week') { start.setDate(start.getDate() - (start.getDay() + 6) % 7); end.setTime(start.getTime()); end.setDate(end.getDate() + 6); }
  else { start.setDate(1); end.setFullYear(start.getFullYear(), start.getMonth() + 1, 0); }
  return { from: localDate(start), to: localDate(end) };
}

/** Reuse calendar/bin logic with actual offer-send events and actual planned missions. */
export function getAdminMetrics(data: Pick<AdminData, 'requests' | 'offers' | 'missions'>, period: EmployerPeriod, now = new Date()) {
  const base = getEmployerMetrics(data.requests, period, now);
  const offerEvents: EmployerRequest[] = data.offers.flatMap(offer => {
    const request = data.requests.find(r => r.id === offer.requestId);
    return request && offer.sentAt ? [{ ...request, id: offer.id, status: 'offer-sent' as const, submittedAt: localDate(new Date(offer.sentAt)) }] : [];
  });
  const missionEvents: EmployerRequest[] = data.missions.flatMap(mission => {
    const request = data.requests.find(r => r.id === mission.requestId);
    return request && mission.status === 'planned' ? [{ ...request, id: mission.id, status: 'confirmed' as const, preferredDate: mission.date }] : [];
  });
  const offers = getEmployerMetrics(offerEvents, period, now).find(m => m.key === 'offers')!;
  const planned = getEmployerMetrics(missionEvents, period, now).find(m => m.key === 'planned')!;
  return base.map(metric => metric.key === 'offers' ? offers : metric.key === 'planned' ? planned : metric);
}
