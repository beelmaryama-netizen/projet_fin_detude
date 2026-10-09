import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EmployerRequest } from '../types/employer';
import { getEmployerMetricRequests, getEmployerMetrics, getEmployerPeriodRequests } from './employerAnalytics';

function request(id: string, overrides: Partial<EmployerRequest> = {}): EmployerRequest {
  return {
    id,
    clientName: 'Client de démonstration',
    serviceType: 'Entretien',
    category: 'COMMERCIAL',
    submittedAt: '2026-10-07',
    preferredDate: '2026-10-09',
    location: 'Montréal',
    description: 'Démonstration',
    status: 'new',
    ...overrides,
  };
}

afterEach(() => vi.unstubAllEnvs());

describe('employer calendar analytics', () => {
  it('starts weeks on Monday and includes today before noon while excluding future submissions', () => {
    const source = [
      request('previous-sunday', { submittedAt: '2026-10-04' }),
      request('monday', { submittedAt: '2026-10-05' }),
      request('today'),
      request('tomorrow', { submittedAt: '2026-10-08' }),
      request('next-week', { submittedAt: '2026-10-12' }),
    ];
    const now = new Date(2026, 9, 7, 0, 5);
    expect(getEmployerPeriodRequests(source, 'week', now).map(item => item.id)).toEqual(['monday', 'today']);
    const metric = getEmployerMetrics(source, 'week', now)[0];
    expect(metric).toMatchObject({ key: 'new', value: 2, trend: 100, bars: [1, 0, 1, 0, 0, 0, 0] });
    expect(source).toHaveLength(5);
  });

  it('keeps Sunday in the same week and rolls into a new period on Monday', () => {
    const source = [request('sunday', { submittedAt: '2026-10-11' }), request('monday', { submittedAt: '2026-10-12' })];
    expect(getEmployerPeriodRequests(source, 'week', new Date(2026, 9, 11, 23, 59)).map(item => item.id)).toEqual(['sunday']);
    expect(getEmployerPeriodRequests(source, 'week', new Date(2026, 9, 12, 0, 1)).map(item => item.id)).toEqual(['monday']);
  });

  it('counts planned missions by preferred date across the full calendar week', () => {
    const source = [
      request('old-submission-upcoming-service', { status: 'confirmed', submittedAt: '2026-09-01', preferredDate: '2026-10-11' }),
      request('today', { status: 'confirmed', preferredDate: '2026-10-07' }),
      request('next-week', { status: 'confirmed', preferredDate: '2026-10-12' }),
      request('previous-week', { status: 'confirmed', preferredDate: '2026-10-04' }),
      request('unconfirmed', { status: 'offer-sent', preferredDate: '2026-10-10' }),
    ];
    expect(getEmployerMetrics(source, 'week', new Date(2026, 9, 7))[3]).toMatchObject({
      key: 'planned', value: 2, trend: 100, bars: [0, 0, 1, 0, 0, 0, 1],
    });
  });

  it.each(['week', 'month'] as const)('returns precisely the requests counted in each %s metric', period => {
    const source = [
      request('new'),
      request('review', { status: 'review' }),
      request('offer', { status: 'offer-sent' }),
      request('old-confirmed', { status: 'confirmed', submittedAt: '2026-08-01', preferredDate: '2026-10-11' }),
      request('previous-new', { submittedAt: '2026-09-30' }),
      request('future-new', { submittedAt: '2026-10-08' }),
      request('confirmed-next-month', { status: 'confirmed', preferredDate: '2026-11-01' }),
      request('waiting', { status: 'waiting' }),
    ];
    const now = new Date(2026, 9, 7);
    for (const metric of getEmployerMetrics(source, period, now)) {
      expect(getEmployerMetricRequests(source, metric.key, period, now)).toHaveLength(metric.value);
    }
    expect(getEmployerMetricRequests(source, 'planned', period, now).map(item => item.id)).toEqual(['old-confirmed']);
    expect(getEmployerMetricRequests(source, 'new', period, now).map(item => item.id)).toEqual(['new']);
  });

  it('handles month and year boundaries with ten genuine calendar bins', () => {
    const source = [
      request('previous-month', { status: 'review', submittedAt: '2026-12-31' }),
      request('first', { status: 'review', submittedAt: '2027-01-01' }),
      request('middle', { status: 'review', submittedAt: '2027-01-16' }),
      request('last', { status: 'review', submittedAt: '2027-01-31' }),
      request('next-month', { status: 'review', submittedAt: '2027-02-01' }),
    ];
    const now = new Date(2027, 0, 31, 0, 5);
    expect(getEmployerPeriodRequests(source, 'month', now).map(item => item.id)).toEqual(['first', 'middle', 'last']);
    expect(getEmployerMetrics(source, 'month', now)[1]).toMatchObject({
      key: 'review', value: 3, trend: 200, bars: [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    });
  });

  it('includes upcoming confirmed services through the last day of the month, including leap day', () => {
    const source = [
      request('leap-day', { status: 'confirmed', preferredDate: '2028-02-29' }),
      request('march', { status: 'confirmed', preferredDate: '2028-03-01' }),
    ];
    expect(getEmployerMetrics(source, 'month', new Date(2028, 1, 1))[3]).toMatchObject({
      value: 1, trend: null, bars: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    });
  });

  it('separates statuses and calculates signed changes only when there is previous-period data', () => {
    const source = [
      request('new'),
      request('review', { status: 'review' }),
      request('offer', { status: 'offer-sent' }),
      request('waiting', { status: 'waiting' }),
      request('previous-offer-one', { status: 'offer-sent', submittedAt: '2026-10-01' }),
      request('previous-offer-two', { status: 'offer-sent', submittedAt: '2026-10-02' }),
      request('previous-review', { status: 'review', submittedAt: '2026-09-29' }),
    ];
    expect(getEmployerMetrics(source, 'week', new Date(2026, 9, 7)).map(({ key, value, trend }) => ({ key, value, trend }))).toEqual([
      { key: 'new', value: 1, trend: null },
      { key: 'review', value: 1, trend: 0 },
      { key: 'offers', value: 1, trend: -50 },
      { key: 'planned', value: 0, trend: null },
    ]);
    expect(getEmployerMetrics([source[4]!], 'week', new Date(2026, 9, 7))[2]).toMatchObject({ value: 0, trend: -100 });
  });

  it.each(['America/Toronto', 'America/Vancouver', 'Pacific/Honolulu', 'Pacific/Auckland'])('preserves date membership and daylight-saving bins in %s', timeZone => {
    vi.stubEnv('TZ', timeZone);
    const source = [request('monday', { submittedAt: '2026-03-02' }), request('dst-sunday', { submittedAt: '2026-03-08' })];
    expect(getEmployerMetrics(source, 'week', new Date(2026, 2, 8, 0, 1))[0]).toMatchObject({
      value: 2, bars: [1, 0, 0, 0, 0, 0, 1],
    });
  });

  it.each(['week', 'month'] as const)('returns empty values without creating history for an empty %s period', period => {
    const metrics = getEmployerMetrics([], period, new Date(2026, 9, 7));
    expect(metrics).toHaveLength(4);
    for (const metric of metrics) {
      expect(metric.value).toBe(0);
      expect(metric.trend).toBeNull();
      expect(metric.bars).toEqual(Array(period === 'week' ? 7 : 10).fill(0));
    }
    expect(getEmployerPeriodRequests([], period)).toEqual([]);
  });
});
