import { z } from 'zod';

const availability = z
  .object({
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    priority: z.number().int().min(1).max(5).default(1),
  })
  .refine((a) => a.endAt > a.startAt, { message: 'La fin doit être après le début', path: ['endAt'] })
  .refine((a) => a.startAt > new Date(), { message: 'La plage doit être dans le futur', path: ['startAt'] });

const availabilities = z.array(availability).min(1, 'Au moins une disponibilité').max(5);

const residential = z.object({
  housingType: z.enum(['APARTMENT', 'HOUSE', 'CONDO', 'OTHER']),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  floors: z.number().int().min(1).max(10).default(1),
  areaSqft: z.number().int().positive().max(100000).optional(),
  hasPets: z.boolean().default(false),
  specialNotes: z.string().trim().max(2000).optional(),
});

const business = z.object({
  businessType: z.string().trim().min(1).max(100),
  companyName: z.string().trim().min(1).max(150),
  areaSqft: z.number().int().positive().max(10000000).optional(),
  areasToClean: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  scopeDescription: z.string().trim().min(10).max(5000),
  frequency: z.enum(['ONE_TIME', 'DAILY', 'WEEKLY', 'CUSTOM']),
  constraints: z.string().trim().max(5000).optional(),
});

const base = {
  addressId: z.string().uuid('addressId invalide'),
  description: z.string().trim().max(5000).optional(),
  availabilities,
};

// Le type de demande décide quel bloc de détails est obligatoire
export const createRequestSchema = z.discriminatedUnion('requestType', [
  z.object({ requestType: z.literal('RESIDENTIAL'), ...base, residential }),
  z.object({ requestType: z.literal('BUSINESS'), ...base, business }),
]);

export const updateStatusSchema = z.object({
  status: z.enum([
    'NEW',
    'UNDER_REVIEW',
    'AWAITING_CLIENT',
    'SCHEDULING',
    'ACTIVE',
    'COMPLETED',
    'CANCELLED',
    'CLOSED',
  ]),
});

export const listRequestsQuerySchema = z.object({
  status: updateStatusSchema.shape.status.optional(),
  requestType: z.enum(['RESIDENTIAL', 'BUSINESS']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
