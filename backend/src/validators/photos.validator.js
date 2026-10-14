import { z } from 'zod';

export const signatureSchema = z.object({
  target: z.enum(['REQUEST', 'MISSION']),
  id: z.string().uuid(),
});

export const requestPhotoSchema = z.object({
  fileKey: z.string().trim().min(1).max(255),
  caption: z.string().trim().max(255).optional(),
});

export const missionPhotoSchema = requestPhotoSchema.extend({
  photoType: z.enum(['BEFORE', 'AFTER', 'OTHER']),
});
