import { z } from 'zod';
import { MAX_DESCRIPTION_LENGTH, MAX_REQUEST_PHOTOS } from '../types/request';

export const residentialDetailsSchema = z.object({
  propertyType: z.enum(['', 'APARTMENT', 'CONDO', 'HOUSE']).refine(value => value !== '', 'Choisissez un type de logement.'),
  bedrooms: z.number().int().min(0).max(30),
  bathrooms: z.number().int().min(1).max(30),
  floors: z.number().int().min(1).max(30),
  areaSqft: z.string().trim().min(1, 'Indiquez la superficie approximative.')
    .regex(/^\d+(?:[.,]\d{1,2})?$/, 'Saisissez un nombre positif, sans séparateur de milliers.')
    .refine(value => Number(value.replace(',', '.')) > 0 && Number(value.replace(',', '.')) <= 1_000_000,
      'La superficie doit être comprise entre 0 et 1 000 000 pi² (0 exclu).'),
  hasPets: z.boolean().nullable().refine(value => value !== null, 'Indiquez si des animaux sont présents.'),
  description: z.string().max(MAX_DESCRIPTION_LENGTH, 'La description est limitée à 500 caractères.'),
});
export const requestPhotosSchema = z.array(z.object({ id: z.string().min(1), uri: z.string().min(1), name: z.string() })).max(MAX_REQUEST_PHOTOS);
