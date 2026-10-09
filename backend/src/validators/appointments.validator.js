import { z } from 'zod';

const schedule = z
  .object({
    scheduledStart: z.coerce.date(),
    scheduledEnd: z.coerce.date(),
  })
  .refine((d) => d.scheduledEnd > d.scheduledStart, {
    message: 'La fin doit être après le début',
    path: ['scheduledEnd'],
  })
  .refine((d) => d.scheduledStart > new Date(), {
    message: 'Le rendez-vous doit être dans le futur',
    path: ['scheduledStart'],
  });

export const confirmSchema = schedule;
export const rescheduleSchema = schedule;

export const clientNotesSchema = z.object({
  clientNotes: z.string().trim().max(2000),
});

export const listAppointmentsQuerySchema = z.object({
  status: z
    .enum(['PENDING_CONFIRMATION', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
