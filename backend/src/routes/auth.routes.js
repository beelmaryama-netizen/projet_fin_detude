import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), asyncHandler(ctrl.register));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(ctrl.login));
router.post('/refresh', validate(refreshSchema), asyncHandler(ctrl.refresh));
router.post('/logout', validate(refreshSchema), asyncHandler(ctrl.logout));

router.get('/me', requireAuth, asyncHandler(ctrl.me));
router.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(ctrl.changePassword)
);

export default router;
