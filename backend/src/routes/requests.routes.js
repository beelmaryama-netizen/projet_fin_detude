import { Router } from 'express';
import * as ctrl from '../controllers/requests.controller.js';
import { validate, validateQuery } from '../middlewares/validate.js';
import { requireAuth, requireRole, requirePasswordChanged } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createRequestSchema,
  updateStatusSchema,
  listRequestsQuerySchema,
} from '../validators/requests.validator.js';

const router = Router();

// Les employés n'ont pas accès aux demandes (ils voient seulement leurs missions)
router.use(requireAuth, requirePasswordChanged, requireRole('CLIENT', 'ADMIN'));

// CLIENT + ADMIN (le service filtre selon le rôle)
router.get('/', validateQuery(listRequestsQuerySchema), asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.getOne));

// CLIENT
router.post('/', requireRole('CLIENT'), validate(createRequestSchema), asyncHandler(ctrl.create));
router.post('/:id/cancel', requireRole('CLIENT'), asyncHandler(ctrl.cancel));

// ADMIN
router.patch('/:id/status', requireRole('ADMIN'), validate(updateStatusSchema), asyncHandler(ctrl.updateStatus));

export default router;
