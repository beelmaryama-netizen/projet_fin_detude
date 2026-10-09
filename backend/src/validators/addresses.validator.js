import { z } from 'zod';

const postalCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/, 'Code postal invalide (ex. H2X 3K2)');

export const createAddressSchema = z.object({
  label: z.string().trim().min(1).max(100),
  line1: z.string().trim().min(1).max(255),
  line2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(1).max(100),
  province: z.string().trim().toUpperCase().length(2).default('QC'),
  postalCode,
  accessNotes: z.string().trim().max(2000).optional(),
});

export const updateAddressSchema = createAddressSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Aucun champ à modifier');
