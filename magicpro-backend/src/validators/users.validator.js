import { z } from 'zod';

export const createEmployeeSchema = z.object({
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
