import { z } from 'zod';
import { passwordSchema } from '../../auth/schemas/authSchemas';
export const completionSchema = z.object({ note: z.string().trim().max(1500, '1500 caractères maximum.'), incident: z.string().trim().max(500, '500 caractères maximum.') });
export const contactSchema = z.object({ message: z.string().trim().min(10, 'Décrivez votre demande (10 caractères minimum).').max(2000), missionId: z.string().optional() });
export const employeePasswordSchema = z.object({ currentPassword: z.string().min(1, 'Saisissez votre mot de passe actuel.'), password: passwordSchema, confirmPassword: z.string() }).refine(value => value.password === value.confirmPassword, { path: ['confirmPassword'], message: 'Les mots de passe doivent être identiques.' }).refine(value => value.password !== value.currentPassword, { path: ['password'], message: 'Choisissez un nouveau mot de passe.' });
export const employeeProfileSchema = z.object({ firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80), phone: z.string().trim().max(30) });
export const missionPhotoSchema = z.object({ id: z.string().min(1), uri: z.string().min(1), phase: z.enum(['BEFORE', 'AFTER']), createdAt: z.iso.datetime() });
