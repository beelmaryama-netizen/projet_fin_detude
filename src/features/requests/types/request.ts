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
export const MAX_REQUEST_PHOTOS = 5;
export const MAX_DESCRIPTION_LENGTH = 500;

export function emptyResidentialDetails(): ResidentialDetails {
  return { propertyType: '', bedrooms: 0, bathrooms: 1, floors: 1, areaSqft: '', hasPets: null, description: '' };
}
