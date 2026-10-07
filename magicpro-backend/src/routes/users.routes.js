import { Router } from 'express';
import * as ctrl from '../controllers/users.controller.js';
import { validate, validateQuery } from '../middlewares/validate.js';
import { requireAuth, requireRole, requirePasswordChanged } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createEmployeeSchema,
  updateStatusSchema,
  updateMeSchema,
  listUsersQuerySchema,
} from '../validators/users.validator.js';

const router = Router();

router.use(requireAuth, requirePasswordChanged);

// Tout utilisateur connecté : modifier son propre profil
// (déclaré AVANT "/:id" pour que "me" ne soit pas pris comme un id)
router.patch('/me', validate(updateMeSchema), asyncHandler(ctrl.updateMe));

// ADMIN uniquement
router.get('/', requireRole('ADMIN'), validateQuery(listUsersQuerySchema), asyncHandler(ctrl.list));
router.post('/employees', requireRole('ADMIN'), validate(createEmployeeSchema), asyncHandler(ctrl.createEmployee));
router.get('/:id', requireRole('ADMIN'), asyncHandler(ctrl.getOne));
router.patch('/:id/status', requireRole('ADMIN'), validate(updateStatusSchema), asyncHandler(ctrl.updateStatus));
router.post('/:id/reset-password', requireRole('ADMIN'), asyncHandler(ctrl.resetPassword));

export default router;
