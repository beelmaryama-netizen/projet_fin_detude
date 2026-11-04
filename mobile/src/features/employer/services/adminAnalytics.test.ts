import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAdminDemoData } from '../store/adminStore';
import type { AdminData, AdminMission, AdminOffer } from '../types/admin';
import { adminPeriodBounds, getAdminMetrics } from './adminAnalytics';
import { localDate } from './adminHelpers';

const template = createAdminDemoData();
const requestId = template.requests[0]!.id;

function fixture(): AdminData {
  return {
    ...template,
    requests: [{ ...template.requests[0]!, submittedAt: '2026-09-01', preferredDate: '2026-12-01', status: 'waiting' }],
    offers: [], missions: [],
  };
}

function offer(id: string, day: string | undefined, status: AdminOffer['status'] = 'sent'): AdminOffer {
  return {
    ...template.offers[0]!, id, requestId, status, createdAt: '2026-09-01T12:00:00',
    sentAt: day ? `${day}T12:00:00` : undefined,
  };
}

function mission(id: string, date: string, status: AdminMission['status'] = 'planned'): AdminMission {
  return { ...template.missions[0]!, id, requestId, status, date };
}

afterEach(() => vi.unstubAllEnvs());

describe('administrative dashboard event metrics', () => {
  it('counts actual send events after acceptance, refusal or cancellation independently of request submission and current status', () => {
    const data = fixture();
    data.offers = [
      offer('sent', '2026-10-07'), offer('accepted', '2026-10-06', 'accepted'),
      offer('refused', '2026-10-05', 'refused'), offer('cancelled', '2026-10-07', 'cancelled'),
      offer('draft', undefined, 'draft'), offer('old-send', '2026-09-01'),
    ];
    expect(getAdminMetrics(data, 'week', new Date(2026, 9, 7)).find(item => item.key === 'offers')).toMatchObject({
      value: 4, bars: [1, 1, 2, 0, 0, 0, 0],
    });
    data.requests = data.requests.map(item => ({ ...item, submittedAt: '2026-10-07', status: 'new' }));
    expect(getAdminMetrics(data, 'week', new Date(2026, 9, 7)).find(item => item.key === 'offers')?.value).toBe(4);
  });

  it('counts planned missions by their service dates and excludes unassigned, cancelled, completed and in-progress records', () => {
    const data = fixture();
    data.missions = [
      mission('monday', '2026-10-05'), mission('sunday-future', '2026-10-11'),
      mission('unassigned', '2026-10-07', 'unassigned'), mission('cancelled', '2026-10-07', 'cancelled'),
      mission('completed', '2026-10-07', 'completed'), mission('started', '2026-10-07', 'in-progress'),
      mission('previous-week', '2026-10-04'), mission('next-week', '2026-10-12'),
    ];
    expect(getAdminMetrics(data, 'week', new Date(2026, 9, 7)).find(item => item.key === 'planned')).toMatchObject({
      value: 2, bars: [1, 0, 0, 0, 0, 0, 1],
    });
  });

  it('includes today’s sends before noon and excludes future sends while retaining the full planned calendar period', () => {
    const data = fixture();
    data.offers = [
      offer('prior-sunday', '2026-10-04'), offer('monday', '2026-10-05'),
      offer('today', '2026-10-07'), offer('tomorrow', '2026-10-08'), offer('next-week', '2026-10-12'),
    ];
    data.missions = [mission('upcoming-sunday', '2026-10-11')];
    const metrics = getAdminMetrics(data, 'week', new Date(2026, 9, 7, 0, 5));
    expect(metrics.find(item => item.key === 'offers')).toMatchObject({ value: 2, trend: 100, bars: [1, 0, 1, 0, 0, 0, 0] });
    expect(metrics.find(item => item.key === 'planned')?.value).toBe(1);
  });

  it('preserves Monday and Sunday membership across a year boundary', () => {
    expect(adminPeriodBounds('week', new Date(2027, 0, 3, 23, 59))).toEqual({ from: '2026-12-28', to: '2027-01-03' });
    expect(adminPeriodBounds('week', new Date(2027, 0, 4, 0, 1))).toEqual({ from: '2027-01-04', to: '2027-01-10' });
    const data = fixture();
    data.offers = [offer('sunday', '2027-01-03'), offer('monday', '2027-01-04')];
    expect(getAdminMetrics(data, 'week', new Date(2027, 0, 3)).find(item => item.key === 'offers')?.value).toBe(1);
    expect(getAdminMetrics(data, 'week', new Date(2027, 0, 4)).find(item => item.key === 'offers')?.value).toBe(1);
  });

  it('uses the full calendar month including leap day for planned missions', () => {
    expect(adminPeriodBounds('month', new Date(2028, 1, 1))).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    const data = fixture();
    data.missions = [mission('first', '2028-02-01'), mission('leap', '2028-02-29'), mission('march', '2028-03-01')];
    data.offers = [offer('previous-month', '2028-01-31'), offer('first', '2028-02-01'), offer('leap', '2028-02-29'), offer('march', '2028-03-01')];
    const metrics = getAdminMetrics(data, 'month', new Date(2028, 1, 29));
    expect(metrics.find(item => item.key === 'planned')).toMatchObject({ value: 2, bars: [1, 0, 0, 0, 0, 0, 0, 0, 0, 1] });
    expect(metrics.find(item => item.key === 'offers')?.value).toBe(2);
  });

  it.each(['week', 'month'] as const)('matches %s displayed counts with inclusive drilldown bounds', period => {
    const now = new Date(2026, 9, 7);
    const bounds = adminPeriodBounds(period, now);
    const sentTo = localDate(now) < bounds.to ? localDate(now) : bounds.to;
    const beforeStart = new Date(`${bounds.from}T12:00:00`);
    beforeStart.setDate(beforeStart.getDate() - 1);
    const afterEnd = new Date(`${bounds.to}T12:00:00`);
    afterEnd.setDate(afterEnd.getDate() + 1);
    const data = fixture();
    data.offers = [
      offer('start', bounds.from, 'accepted'), offer('today', sentTo, 'refused'),
      offer('previous', localDate(beforeStart)), offer('future', '2026-10-08'), offer('draft', undefined, 'draft'),
    ];
    data.missions = [
      mission('start', bounds.from), mission('last', bounds.to),
      mission('previous', localDate(beforeStart)), mission('next', localDate(afterEnd)),
      mission('unassigned', bounds.from, 'unassigned'),
    ];
    const displayed = getAdminMetrics(data, period, now);
    const sentMatches = data.offers.filter(item => item.sentAt && localDate(new Date(item.sentAt)) >= bounds.from && localDate(new Date(item.sentAt)) <= sentTo);
    const plannedMatches = data.missions.filter(item => item.status === 'planned' && item.date >= bounds.from && item.date <= bounds.to);
    expect(sentMatches.map(item => item.id)).toEqual(['start', 'today']);
    expect(plannedMatches.map(item => item.id)).toEqual(['start', 'last']);
    expect(displayed.find(item => item.key === 'offers')?.value).toBe(sentMatches.length);
    expect(displayed.find(item => item.key === 'planned')?.value).toBe(plannedMatches.length);
    for (const metric of displayed) expect(metric.bars.reduce((sum, value) => sum + value, 0)).toBe(metric.value);
  });

  it('assigns send timestamps to the local day rather than slicing their UTC date', () => {
    vi.stubEnv('TZ', 'America/Toronto');
    const data = fixture();
    data.offers = [
      { ...offer('sunday-local', '2026-10-05'), sentAt: '2026-10-05T00:30:00Z' },
      { ...offer('monday-local', '2026-10-05'), sentAt: '2026-10-05T04:30:00Z' },
    ];
    expect(getAdminMetrics(data, 'week', new Date(2026, 9, 5)).find(item => item.key === 'offers')).toMatchObject({
      value: 1, bars: [1, 0, 0, 0, 0, 0, 0],
    });
  });
});
