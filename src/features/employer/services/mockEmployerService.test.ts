import { afterEach, describe, expect, it, vi } from 'vitest';
import { filterEmployerRequests, formatEmployerDate, getEmployerRequests, getEmployerSummary } from './mockEmployerService';
import type { EmployerRequestFilter } from '../types/employer';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('employer request demonstration data', () => {
  it.each([
    ['all', ['demo-request-001', 'demo-request-002', 'demo-request-003', 'demo-request-004', 'demo-request-005', 'demo-request-006']],
    ['new', ['demo-request-001', 'demo-request-002']],
    ['actionable', ['demo-request-001', 'demo-request-002', 'demo-request-003']],
    ['waiting', ['demo-request-004', 'demo-request-005']],
    ['confirmed', ['demo-request-006']],
  ] satisfies Array<[EmployerRequestFilter, string[]]>)('filters %s requests without changing source order', (filter, ids) => {
    const requests = getEmployerRequests();
    expect(filterEmployerRequests(requests, filter).map(request => request.id)).toEqual(ids);
    expect(requests).toHaveLength(6);
  });

  it('counts new requests as actionable and sent offers as waiting', () => {
    expect(getEmployerSummary(getEmployerRequests())).toEqual({ new: 2, actionable: 3, waiting: 2, confirmed: 1 });
    expect(getEmployerSummary([])).toEqual({ new: 0, actionable: 0, waiting: 0, confirmed: 0 });
  });

  it('returns isolated data on every read and covers each status and main service category', () => {
    const first = getEmployerRequests();
    const second = getEmployerRequests();
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first[0]).not.toBe(second[0]);
    first[0]!.clientName = 'Modified locally';
    first.pop();
    expect(getEmployerRequests()).toEqual(second);
    expect(new Set(second.map(request => request.status))).toEqual(new Set(['new', 'review', 'waiting', 'offer-sent', 'confirmed']));
    expect(new Set(second.map(request => request.category))).toEqual(new Set(['RESIDENTIAL', 'COMMERCIAL', 'MEDICAL', 'INDUSTRIAL']));
  });

  it('keeps relative calendar dates stable at midnight and across month boundaries', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 31, 0, 5));
    const firstRead = getEmployerRequests();
    expect(firstRead[0]).toMatchObject({ submittedAt: '2026-10-31', preferredDate: '2026-11-05' });
    expect(firstRead[5]).toMatchObject({ submittedAt: '2026-10-26', preferredDate: '2026-11-03' });
    vi.setSystemTime(new Date(2026, 9, 31, 23, 55));
    expect(getEmployerRequests()).toEqual(firstRead);
  });

  it.each(['America/Toronto', 'America/Vancouver', 'Pacific/Honolulu', 'Pacific/Auckland'])('preserves the requested calendar date in %s', timeZone => {
    vi.stubEnv('TZ', timeZone);
    expect(formatEmployerDate('2026-10-07')).toBe('7 oct. 2026');
    expect(formatEmployerDate('2026-03-08')).toBe('8 mars 2026');
  });
});
