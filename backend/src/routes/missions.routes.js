import { Router } from 'express';
import * as ctrl from '../controllers/missions.controller.js';
import { validate, validateQuery } from '../middlewares/validate.js';
import { requireAuth, requireRole, requirePasswordChanged } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createMissionSchema,
  updateMissionSchema,
  assignSchema,
  listMissionsQuerySchema,
  completeSchema,
  checklistItemsSchema,
  toggleChecklistSchema,
} from '../validators/missions.validator.js';

const router = Router();

// Glossaire : la mission est visible par l'employé assigné et l'admin, jamais par le client
router.use(requireAuth, requirePasswordChanged, requireRole('ADMIN', 'EMPLOYEE'));

// ADMIN (toutes) + EMPLOYÉ (ses missions assignées)
router.get('/', validateQuery(listMissionsQuerySchema), asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.getOne));

// ADMIN
router.post('/', requireRole('ADMIN'), validate(createMissionSchema), asyncHandler(ctrl.create));
router.patch('/:id', requireRole('ADMIN'), validate(updateMissionSchema), asyncHandler(ctrl.update));
router.get('/:id/available-employees', requireRole('ADMIN'), asyncHandler(ctrl.availableEmployees));
router.post('/:id/assignments', requireRole('ADMIN'), validate(assignSchema), asyncHandler(ctrl.assign));
router.delete('/:id/assignments/:employeeId', requireRole('ADMIN'), asyncHandler(ctrl.unassign));

// Checklist : l'admin la prépare, l'employé la coche
router.post('/:id/checklist', requireRole('ADMIN'), validate(checklistItemsSchema), asyncHandler(ctrl.addChecklistItems));
router.delete('/:id/checklist/:itemId', requireRole('ADMIN'), asyncHandler(ctrl.removeChecklistItem));
router.patch('/:id/checklist/:itemId', validate(toggleChecklistSchema), asyncHandler(ctrl.toggleChecklistItem));

// EMPLOYÉ assigné : exécution (séquence 7.4)
router.post('/:id/start', requireRole('EMPLOYEE'), asyncHandler(ctrl.start));
router.post('/:id/complete', requireRole('EMPLOYEE'), validate(completeSchema), asyncHandler(ctrl.complete));

export default router;
