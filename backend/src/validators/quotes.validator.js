import { z } from 'zod';

const item = z.object({
  description: z.string().trim().min(1).max(255),
  qty: z.number().positive().max(10000),
  unitPrice: z.number().nonnegative().max(1000000),
});

export const createQuoteSchema = z.object({
  items: z.array(item).min(1, 'Au moins une ligne').max(50),
  estimatedMinutes: z.number().int().positive().max(100000).optional(),
  employeesNeeded: z.number().int().min(1).max(50).default(1),
});

export const updateQuoteSchema = createQuoteSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Aucun champ à modifier');

export const sendQuoteSchema = z.object({
  validDays: z.number().int().min(1).max(90).default(14),
});
