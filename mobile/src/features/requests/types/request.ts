import type { BusinessCategory, BusinessDetails, RequestDocument } from './business';
export type RequestCategory = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'MEDICAL' | 'OTHER';
export type PropertyType = 'APARTMENT' | 'CONDO' | 'HOUSE';
export interface ResidentialDetails {
  propertyType: PropertyType | '';
  bedrooms: number;
  bathrooms: number;
  floors: number;
  areaSqft: string;
  hasPets: boolean | null;
  description: string;
}
export interface RequestPhoto { id: string; uri: string; name: string }
export type TimeSlot = 'MORNING' | 'AFTERNOON' | 'EVENING';
export interface Availability { date: string; slot: TimeSlot | '' }
export interface SchedulePreferences {
  availabilities: Availability[];
  instructions: string;
  accessNotes: string;
  addressId: string;
}
export const emptySchedule = (): SchedulePreferences => ({ availabilities: [{ date: '', slot: '' }], instructions: '', accessNotes: '', addressId: '' });
export type RequestDetails = { category: 'RESIDENTIAL'; residential: ResidentialDetails } | { category: BusinessCategory; business: BusinessDetails; documents: RequestDocument[] };
export type RequestSubmission = RequestDetails & {
  photos: RequestPhoto[];
  schedule: SchedulePreferences;
  submissionKey: string;
}
export const MAX_REQUEST_PHOTOS = 5;
export const MAX_DESCRIPTION_LENGTH = 500;

export function emptyResidentialDetails(): ResidentialDetails {
  return { propertyType: '', bedrooms: 0, bathrooms: 1, floors: 1, areaSqft: '', hasPets: null, description: '' };
}
