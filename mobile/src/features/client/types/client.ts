import type { User } from '../../../types/identity';
import type { RequestPhoto, SchedulePreferences, RequestSubmission, RequestDetails } from '../../requests/types/request';
import type { ClientReservation } from './reservation';

export type RequestStatus = 'NEW' | 'IN_REVIEW' | 'QUOTED' | 'ACCEPTED' | 'CANCELLED' | 'CLOSED';
export type QuoteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export interface ClientAddress {
  id: string; label: 'Maison' | 'Travail' | 'Autre'; street: string; unit: string; city: string;
  province: string; postalCode: string; accessNotes: string; isDefault: boolean;
}
export type AddressInput = Omit<ClientAddress, 'id'>;
export type ClientRequest = RequestDetails & {
  id: string; serviceTitle: string; createdAt: string; status: RequestStatus;
  photos: RequestPhoto[]; schedule: SchedulePreferences;
  address: ClientAddress | null; history: { at: string; label: string }[];
}
export interface ClientQuote {
  id: string; requestId: string; serviceTitle: string; address: string; status: QuoteStatus;
  durationHours: number; startAt: string; endAt: string; expiresAt: string;
  lines: { label: string; cents: number }[]; taxes: { label: string; cents: number }[];
  totalCents: number; adminNote: string; rejectionReason?: string;
}
export type NotificationTarget = { kind: 'request' | 'quote' | 'reservation'; id: string };
export interface ClientNotification { id: string; title: string; text: string; createdAt: string; read: boolean; target: NotificationTarget }
export interface NotificationPreferences { newQuotes: boolean; bookingConfirmations: boolean; bookingChanges: boolean; reminders: boolean }
export interface ProfileInput { firstName: string; lastName: string; phone: string }
export interface SecuritySettings { mfaEnabled: boolean; hasPassword: boolean }
export interface SupportInput { subject: string; message: string }
export interface ClientServices {
  requests: { list(user: User): Promise<ClientRequest[]>; get(user: User, id: string): Promise<ClientRequest>; create(user: User, input: RequestSubmission): Promise<ClientRequest> };
  quotes: { list(user: User): Promise<ClientQuote[]>; get(user: User, id: string): Promise<ClientQuote>; accept(user: User, id: string): Promise<ClientReservation>; reject(user: User, id: string, reason: string): Promise<void> };
  reservations: { list(user: User): Promise<ClientReservation[]>; get(user: User, id: string): Promise<ClientReservation>; cancel(user: User, id: string): Promise<void> };
  addresses: { list(user: User): Promise<ClientAddress[]>; save(user: User, input: AddressInput, id?: string): Promise<ClientAddress>; remove(user: User, id: string): Promise<void>; setDefault(user: User, id: string): Promise<void> };
  notifications: { list(user: User): Promise<ClientNotification[]>; markRead(user: User, id?: string): Promise<void>; preferences(user: User): Promise<NotificationPreferences>; savePreferences(user: User, preferences: NotificationPreferences): Promise<NotificationPreferences> };
  support: { send(user: User, input: SupportInput): Promise<{ reference: string }> };
}
export class ClientServiceError extends Error {
  constructor(public readonly code: 'NETWORK' | 'SERVER' | 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION', message: string) { super(message); this.name = 'ClientServiceError'; }
}
