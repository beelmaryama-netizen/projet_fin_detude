import { z } from 'zod';
import { establishmentTypes, businessZones, frequencies, MAX_DOCUMENTS, MAX_DOCUMENT_BYTES } from '../types/business';
import { residentialDetailsSchema } from './requestSchemas';
import { businessProfiles } from '../data/businessProfiles';
import type { BusinessCategory } from '../types/business';
export const businessDetailsSchema = z.object({
  establishmentType: z.enum(['', ...establishmentTypes]).refine(value => value !== '', 'Choisissez un établissement.'),
  companyName: z.string().trim().min(2, 'Indiquez le nom de l’établissement.').max(150),
  areaSqft: residentialDetailsSchema.shape.areaSqft,
  floors: z.number().int().min(1).max(100),
  siteAddress: z.string().trim().min(5, 'Indiquez l’adresse complète du site.').max(300),
  zones: z.array(z.enum(businessZones)).min(1, 'Sélectionnez au moins une zone.').max(businessZones.length),
  description: z.string().trim().min(10, 'Décrivez le service souhaité (10 caractères minimum).').max(1000),
  frequency: z.enum(['', ...frequencies]).refine(value => value !== '', 'Choisissez une fréquence.'),
  customFrequency: z.string().max(300), preferredHours: z.string().max(300),
  equipment: z.string().max(500), restrictedAreas: z.string().max(500), allowedProducts: z.string().max(500), constraints: z.string().max(1000),
}).refine(value => value.frequency !== 'Personnalisé' || value.customFrequency.trim().length > 0, { path: ['customFrequency'], message: 'Précisez la fréquence souhaitée.' });
export const requestDocumentsSchema = z.array(z.object({ id: z.string().min(1), uri: z.string().min(1), name: z.string().min(1), size: z.number().int().positive().max(MAX_DOCUMENT_BYTES), mimeType: z.literal('application/pdf') })).max(MAX_DOCUMENTS);
export const businessSchemaFor = (category: BusinessCategory) => businessDetailsSchema.superRefine((value, context) => {
  const profile = businessProfiles[category];
  if (!profile.establishments.includes(value.establishmentType)) context.addIssue({ code: 'custom', path: ['establishmentType'], message: 'Choisissez un établissement adapté à ce type de service.' });
  if (value.zones.some(zone => !profile.zones.includes(zone))) context.addIssue({ code: 'custom', path: ['zones'], message: 'Choisissez uniquement les zones proposées pour ce type de service.' });
});
