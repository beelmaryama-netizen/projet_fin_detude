import { z } from 'zod';

export function localDateKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function preferenceSchema(now = new Date()) {
  return z.object({
    date: z.string().refine(value => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year!, month! - 1, day!);
      return localDateKey(date) === value && value >= localDateKey(now);
    }, 'Indiquez une date valide, aujourd’hui ou plus tard (AAAA-MM-JJ).'),
    timeSlot: z.enum(['', 'MORNING', 'AFTERNOON']).refine(value => value !== '', 'Choisissez un créneau souhaité.'),
    notes: z.string().max(500, 'Les préférences sont limitées à 500 caractères.'),
  });
}
