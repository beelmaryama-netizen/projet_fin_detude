import { z } from 'zod';

export const createMissionSchema = z.object({
  appointmentId: z.string().uuid('appointmentId invalide'),
  internalInstructions: z.string().trim().max(5000).optional(),
});

export const updateMissionSchema = z.object({
  internalInstructions: z.string().trim().max(5000),
});

export const assignSchema = z.object({
  employeeIds: z
    .array(z.string().uuid('employeeId invalide'))
    .min(1, 'Au moins un employé')
    .max(10)
    .transform((ids) => [...new Set(ids)]),
});

export const listMissionsQuerySchema = z.object({
  status: z.enum(['TO_ASSIGN', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  employeeId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const completeSchema = z.object({
  note: z.string().trim().max(2000).optional(),
});

export const checklistItemsSchema = z.object({
  items: z.array(z.string().trim().min(1).max(255)).min(1).max(50),
});

export const toggleChecklistSchema = z.object({
  isDone: z.boolean(),
});
