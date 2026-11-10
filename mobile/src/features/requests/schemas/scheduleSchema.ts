import { businessSchemaFor, requestDocumentsSchema } from './businessSchema';
import { z } from 'zod';
import { todayLocal } from '../../client/services/clientFormatters';
import { residentialDetailsSchema, requestPhotosSchema } from './requestSchemas';
export const scheduleSchema = z.object({
  availabilities: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format : AAAA-MM-JJ.')
      .refine(value => { const parsed = new Date(`${value}T12:00:00Z`); return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; }, 'Cette date n’existe pas.')
      .refine(value => value > todayLocal(), 'Choisissez une date à partir de demain.'),
    slot: z.enum(['', 'MORNING', 'AFTERNOON', 'EVENING', 'CUSTOM']).refine(value => value !== '', 'Choisissez une plage horaire.'),
    startTime: z.string().optional(), endTime: z.string().optional(),
  }).superRefine((value, ctx) => { if (value.slot !== 'CUSTOM') return; const valid = (time?: string) => !!time && /^([01]\d|2[0-3]):[0-5]\d$/.test(time); if (!valid(value.startTime)) ctx.addIssue({ code: 'custom', path: ['startTime'], message: 'Format HH:MM requis.' }); if (!valid(value.endTime) || (value.endTime ?? '') <= (value.startTime ?? '')) ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'La fin doit suivre le début (HH:MM).' }); })).min(1).max(2).refine(values => new Set(values.map(value => `${value.date}/${value.slot}/${value.startTime ?? ""}/${value.endTime ?? ""}`)).size === values.length, 'Les deux disponibilités doivent être différentes.'),
  instructions: z.string().max(1000), accessNotes: z.string().max(500), addressId: z.string(),
});
const common = { photos: requestPhotosSchema, schedule: scheduleSchema, submissionKey: z.string().min(1) };
export const requestSubmissionSchema = z.discriminatedUnion('category', [z.object({ ...common, category: z.literal('RESIDENTIAL'), residential: residentialDetailsSchema }), z.object({ ...common, category: z.literal('COMMERCIAL'), business: businessSchemaFor('COMMERCIAL'), documents: requestDocumentsSchema }), z.object({ ...common, category: z.literal('INDUSTRIAL'), business: businessSchemaFor('INDUSTRIAL'), documents: requestDocumentsSchema }), z.object({ ...common, category: z.literal('MEDICAL'), business: businessSchemaFor('MEDICAL'), documents: requestDocumentsSchema })]);
