import { Router } from 'express';
import { z } from 'zod';
import { authLimiter } from '../middlewares/rateLimit.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  socialChallenge,
  socialLogin,
} from '../services/socialAuth.service.js';
const router = Router();
for (const provider of ['google', 'apple']) {
  router.post(
    '/' + provider + '/challenge',
    authLimiter,
    asyncHandler(async (_req, res) =>
      res.json(await socialChallenge(provider)),
    ),
  );
  router.post(
    '/' + provider,
    authLimiter,
    validate(
      z.object({
        challengeId: z.string().uuid(),
        idToken: z.string().min(50).max(10000),
        firstName: z.string().max(100).optional(),
        lastName: z.string().max(100).optional(),
      }),
    ),
    asyncHandler(async (req, res) =>
      res.json(await socialLogin(provider, req.body)),
    ),
  );
}
export default router;
