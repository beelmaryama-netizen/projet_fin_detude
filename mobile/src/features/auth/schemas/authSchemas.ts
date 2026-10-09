import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email('Saisissez un courriel valide.');
export const passwordSchema = z.string()
  .min(12, 'Utilisez au moins 12 caractères.')
  .max(72, 'Utilisez au maximum 72 caractères.')
  .regex(/[a-z]/, 'Ajoutez une lettre minuscule.')
  .regex(/[A-Z]/, 'Ajoutez une lettre majuscule.')
  .regex(/[0-9]/, 'Ajoutez un chiffre.')
  .regex(/[^A-Za-z0-9]/, 'Ajoutez un caractère spécial.')
  .refine(value => new TextEncoder().encode(value).length <= 72,
    'Le mot de passe doit tenir dans 72 octets (les caractères accentués en utilisent plusieurs).');

export const loginSchema = z.object({
  email: emailSchema,
  // Do not enforce the new-password policy on an existing password.
  password: z.string().min(1, 'Saisissez votre mot de passe.'),
});
export const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'Saisissez votre prénom.').max(80),
  lastName: z.string().trim().min(1, 'Saisissez votre nom.').max(80),
  email: emailSchema,
  phone: z.string().trim().min(1, 'Saisissez votre téléphone.')
    .regex(/^\+?[\d\s().-]+$/, 'Saisissez un téléphone valide.')
    .refine(value => { const digits = value.replace(/\D/g, ''); return digits.length >= 10 && digits.length <= 15; },
      'Le téléphone doit contenir entre 10 et 15 chiffres.'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirmez votre mot de passe.'),
}).refine(value => value.password === value.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas.', path: ['confirmPassword'],
});
export const forgotPasswordSchema = z.object({ email: emailSchema });
export const codeSchema = z.object({ code: z.string().regex(/^\d{6}$/, 'Saisissez les 6 chiffres du code.') });
export const resetPasswordSchema = z.object({ password: passwordSchema, confirmPassword: z.string() })
  .refine(value => value.password === value.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.', path: ['confirmPassword'],
  });
export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type CodeForm = z.infer<typeof codeSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
