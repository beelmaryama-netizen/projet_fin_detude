export interface ClientReservation {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  startAt: string;
  endAt: string;
  timeZone: string;
  serviceTitle: string;
  address: string;
  requestId: string;
  quoteId: string;
  instructions: string;
  summary: string;
  cancellationDeadline: string;
  team?: string[]; completedAt?: string; report?: string;
}
