import { z } from 'zod';

export const employeeDetailsSchema = z.object({
 city: z.string().max(120), specialties: z.array(z.string().max(100)).max(30), availability: z.string().max(500),
 workingHours: z.object({ days: z.array(z.number().int().min(0).max(6)).min(1), start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) }).refine(v => v.end > v.start).optional()
});
export const createEmployeeSchema = z.object({
  employeeDetails: employeeDetailsSchema.optional(),
  email: z.string().trim().toLowerCase().email('Email invalide'),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(30).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});

export const updateMeSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    phone: z.string().trim().max(30).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, 'Aucun champ à modifier');

export const listUsersQuerySchema = z.object({
  role: z.enum(['CLIENT', 'EMPLOYEE', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  search: z.string().trim().optional(),
});
