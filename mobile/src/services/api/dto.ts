import type { User } from '../../types/identity';
import type { RequestDetails, SchedulePreferences } from '../../features/requests/types/request';
export interface AddressDto { id: string; label: string; line1: string; line2?: string | null; city: string; province: string; postalCode: string; accessNotes?: string | null; isDefault?: boolean }
export interface PhotoDto { id: string; url: string; fileKey: string; caption?: string | null; photoType?: 'BEFORE' | 'AFTER' | 'OTHER'; createdAt: string }
export interface UserDto extends User { status: 'ACTIVE' | 'SUSPENDED'; createdAt: string; employeeDetails?: { city: string; specialties: string[]; availability: string; workingHours?: { days: number[]; start: string; end: string } } | null }
export interface RequestDto {
 id: string; clientId: string; requestType: 'RESIDENTIAL' | 'BUSINESS'; status: string; createdAt: string; updatedAt: string;
 description?: string | null; address: AddressDto; client?: UserDto;
 uiDetails?: (RequestDetails & { schedule?: SchedulePreferences }) | null;
 residentialDetails?: { housingType: 'APARTMENT' | 'HOUSE' | 'CONDO' | 'OTHER'; bedrooms: number; bathrooms: number; floors: number; areaSqft?: number | null; hasPets: boolean; specialNotes?: string | null } | null;
 businessDetails?: { businessType: string; companyName: string; areaSqft?: number | null; areasToClean?: string[]; scopeDescription: string; frequency: string; constraints?: string | null } | null;
 availabilities: { startAt: string; endAt: string }[]; photos: PhotoDto[];
}
export interface QuoteDto { id: string; requestId: string; status: string; items: { description: string; lineTotal: string | number }[]; subtotal: string | number; taxes: string | number; total: string | number; validityHours?: number; estimatedMinutes?: number | null; employeesNeeded?: number; proposedStart?: string | null; proposedEnd?: string | null; notes?: string | null; expiresAt?: string | null; sentAt?: string | null; requiresBeforePhotos?: boolean; requiresAfterPhotos?: boolean }
export interface AppointmentDto { id: string; requestId: string; acceptedQuoteId: string; scheduledStart?: string | null; scheduledEnd?: string | null; status: string; clientNotes?: string | null; request: Pick<RequestDto, 'id' | 'requestType' | 'address'> & { client?: UserDto }; team?: string[]; completedAt?: string; report?: string }
export interface MissionDto { id: string; appointmentId: string; status: string; internalInstructions?: string | null; report?: string | null; incident?: string | null; startedAt?: string | null; completedAt?: string | null; appointment: AppointmentDto & { request: RequestDto; acceptedQuote?: QuoteDto }; assignments: { employee: Pick<UserDto, 'id' | 'firstName' | 'lastName'> }[]; checklistItems: { id: string; label: string; isDone: boolean; note?: string }[]; photos: PhotoDto[]; requiresBeforePhotos?: boolean; requiresAfterPhotos?: boolean }
export interface NotificationDto { id: string; title: string; body: string; createdAt: string; readAt?: string | null; relatedEntityType?: string; relatedEntityId?: string }
