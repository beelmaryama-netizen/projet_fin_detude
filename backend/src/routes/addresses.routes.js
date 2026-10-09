import { Router } from 'express';
import * as ctrl from '../controllers/addresses.controller.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth, requireRole, requirePasswordChanged } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createAddressSchema, updateAddressSchema } from '../validators/addresses.validator.js';

const router = Router();

// Adresses = espace CLIENT, chaque client ne voit que les siennes
router.use(requireAuth, requirePasswordChanged, requireRole('CLIENT'));

router.get('/', asyncHandler(ctrl.list));
router.post('/', validate(createAddressSchema), asyncHandler(ctrl.create));
router.get('/:id', asyncHandler(ctrl.getOne));
router.patch('/:id', validate(updateAddressSchema), asyncHandler(ctrl.update));
router.delete('/:id', asyncHandler(ctrl.remove));

export default router;
