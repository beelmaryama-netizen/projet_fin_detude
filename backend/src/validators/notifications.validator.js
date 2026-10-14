import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  unreadOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const deviceSchema = z.object({
  token: z.string().trim().min(10).max(255),
  platform: z.enum(['ANDROID', 'IOS']),
});

export const unregisterDeviceSchema = z.object({
  token: z.string().trim().min(10).max(255),
});
