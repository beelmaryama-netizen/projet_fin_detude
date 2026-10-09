import { Router } from 'express';
import * as ctrl from '../controllers/appointments.controller.js';
import { validate, validateQuery } from '../middlewares/validate.js';
import { requireAuth, requireRole, requirePasswordChanged } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  confirmSchema,
  rescheduleSchema,
  clientNotesSchema,
  listAppointmentsQuerySchema,
} from '../validators/appointments.validator.js';

const router = Router();

// Matrice des permissions : EMPLOYÉ = Non pour les réservations
router.use(requireAuth, requirePasswordChanged, requireRole('CLIENT', 'ADMIN'));

// CLIENT (ses réservations) + ADMIN (toutes)
router.get('/', validateQuery(listAppointmentsQuerySchema), asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.getOne));

// CLIENT
router.patch('/:id/client-notes', requireRole('CLIENT'), validate(clientNotesSchema), asyncHandler(ctrl.updateClientNotes));

// ADMIN
router.post('/:id/confirm', requireRole('ADMIN'), validate(confirmSchema), asyncHandler(ctrl.confirm));
router.post('/:id/reschedule', requireRole('ADMIN'), validate(rescheduleSchema), asyncHandler(ctrl.reschedule));
router.post('/:id/cancel', requireRole('ADMIN'), asyncHandler(ctrl.cancel));

export default router;
