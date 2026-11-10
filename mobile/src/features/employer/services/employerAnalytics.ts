import type { EmployerRequest, EmployerRequestStatus } from '../types/employer';

export type EmployerPeriod = 'week' | 'month';
export type EmployerMetricKey = 'new' | 'review' | 'offers' | 'planned';

export interface EmployerMetric {
  key: EmployerMetricKey;
  label: string;
  value: number;
  /** Percentage change against the preceding calendar period; unavailable when it had no matches. */
  trend: number | null;
  /** Actual counts, in seven daily bins or ten equal calendar-month segments. */
  bars: readonly number[];
}

export const employerPeriodLabels: Record<EmployerPeriod, string> = {
  week: 'Cette semaine',
  month: 'Ce mois-ci',
};

interface CalendarWindow {
  start: Date;
  end: Date;
}

const metricDefinitions: ReadonlyArray<{
  key: EmployerMetricKey;
  label: string;
  status: EmployerRequestStatus;
  dateField: 'submittedAt' | 'preferredDate';
}> = [
  { key: 'new', label: 'Nouvelles demandes', status: 'new', dateField: 'submittedAt' },
  { key: 'review', label: 'En analyse', status: 'review', dateField: 'submittedAt' },
  { key: 'offers', label: 'Offres envoyées', status: 'offer-sent', dateField: 'submittedAt' },
  { key: 'planned', label: 'Missions planifiées', status: 'confirmed', dateField: 'preferredDate' },
];

function getCalendarWindow(period: EmployerPeriod, now: Date, offset = 0): CalendarWindow {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'week') {
    start.setDate(start.getDate() - (start.getDay() + 6) % 7 + offset * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }
  start.setDate(1);
  start.setMonth(start.getMonth() + offset);
  return { start, end: new Date(start.getFullYear(), start.getMonth() + 1, 1) };
}

function getSubmissionWindow(period: EmployerPeriod, now: Date): CalendarWindow {
  const start = getCalendarWindow(period, now).start;
  // Dates have no time of day. Include today even when now is before local noon.
  return { start, end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) };
}

function parseCalendarDate(value: string): Date {
  // Avoid UTC conversion shifting an ISO calendar date onto the preceding local day.
  return new Date(`${value}T12:00:00`);
}

function isInWindow(value: string, window: CalendarWindow): boolean {
  const date = parseCalendarDate(value);
  return date >= window.start && date < window.end;
}

function calendarDayNumber(date: Date): number {
  // Calendar arithmetic remains stable across 23- and 25-hour daylight-saving days.
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;
}

/** Requests submitted in the selected calendar period, through the end of today. */
export function getEmployerPeriodRequests(
  requests: readonly EmployerRequest[],
  period: EmployerPeriod,
  now: Date = new Date(),
): EmployerRequest[] {
  const window = getSubmissionWindow(period, now);
  return requests.filter(request => isInWindow(request.submittedAt, window));
}

/** The exact requests counted by one metric, for drilling into a dashboard card. */
export function getEmployerMetricRequests(
  requests: readonly EmployerRequest[],
  key: EmployerMetricKey,
  period: EmployerPeriod,
  now: Date = new Date(),
): EmployerRequest[] {
  const definition = metricDefinitions.find(metric => metric.key === key)!;
  const window = key === 'planned' ? getCalendarWindow(period, now) : getSubmissionWindow(period, now);
  return requests.filter(request => request.status === definition.status && isInWindow(request[definition.dateField], window));
}

/** Local demonstration analytics, derived exclusively from the supplied requests. */
export function getEmployerMetrics(
  requests: readonly EmployerRequest[],
  period: EmployerPeriod,
  now: Date = new Date(),
): EmployerMetric[] {
  const calendarWindow = getCalendarWindow(period, now);
  const previousWindow = getCalendarWindow(period, now, -1);
  const binCount = period === 'week' ? 7 : 10;
  const startDay = calendarDayNumber(calendarWindow.start);
  const daysInPeriod = calendarDayNumber(calendarWindow.end) - startDay;

  return metricDefinitions.map(({ key, label, status, dateField }) => {
    // Confirmed appointments count by service date, including upcoming dates in this period.
    const matching = getEmployerMetricRequests(requests, key, period, now);
    const previous = requests.filter(request => request.status === status && isInWindow(request[dateField], previousWindow)).length;
    const bars = Array<number>(binCount).fill(0);
    for (const request of matching) {
      const day = calendarDayNumber(parseCalendarDate(request[dateField])) - startDay;
      const bin = Math.floor(day * binCount / daysInPeriod);
      bars[bin] = (bars[bin] ?? 0) + 1;
    }
    return {
      key,
      label,
      value: matching.length,
      trend: previous === 0 ? null : Math.round((matching.length - previous) / previous * 100),
      bars,
    };
  });
}
