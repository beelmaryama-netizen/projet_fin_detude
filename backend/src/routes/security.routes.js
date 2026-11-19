import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';
import { requireAuth, requirePasswordChanged } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { password } from '../validators/auth.validator.js';
import * as security from '../services/challenges.service.js';
import { prisma } from '../config/prisma.js';
const router = Router();
const verify = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
});
router.post(
  '/forgot-password',
  authLimiter,
  validate(z.object({ email: z.string().trim().toLowerCase().email() })),
  asyncHandler(async (req, res) =>
    res.json(await security.requestRecovery(req.body.email)),
  ),
);
router.post(
  '/verify-code',
  authLimiter,
  validate(verify),
  asyncHandler(async (req, res) =>
    res.json(
      await security.verifyChallenge(req.body.challengeId, req.body.code),
    ),
  ),
);
router.post(
  '/resend-code',
  authLimiter,
  validate(z.object({ challengeId: z.string().uuid() })),
  asyncHandler(async (req, res) =>
    res.json(await security.resendChallenge(req.body.challengeId)),
  ),
);
router.post(
  '/reset-password',
  authLimiter,
  validate(z.object({ resetToken: z.string().min(50).max(200), password })),
  asyncHandler(async (req, res) => {
    await security.resetPassword(req.body.resetToken, req.body.password);
    res.status(204).end();
  }),
);
router.get(
  '/security',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.json({ mfaEnabled: user.mfaEnabled, hasPassword: !!user.passwordHash });
  }),
);
router.post(
  '/mfa/challenge',
  requireAuth,
  requirePasswordChanged,
  authLimiter,
  validate(
    z.object({
      enabled: z.boolean(),
      currentPassword: z.string().max(200).optional(),
    }),
  ),
  asyncHandler(async (req, res) =>
    res.json(
      await security.requestMfa(
        req.user.id,
        req.body.enabled,
        req.body.currentPassword,
      ),
    ),
  ),
);
router.post(
  '/mfa/confirm',
  requireAuth,
  requirePasswordChanged,
  authLimiter,
  validate(verify),
  asyncHandler(async (req, res) =>
    res.json(
      await security.confirmMfa(
        req.user.id,
        req.body.challengeId,
        req.body.code,
      ),
    ),
  ),
);
export default router;
