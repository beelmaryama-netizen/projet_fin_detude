import { Router } from 'express';
import * as ctrl from '../controllers/notifications.controller.js';
import { validate, validateQuery } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  listNotificationsQuerySchema,
  deviceSchema,
  unregisterDeviceSchema,
} from '../validators/notifications.validator.js';

const router = Router();

// Les 3 rôles : chacun ne voit que ses propres notifications
router.use(requireAuth);

router.get('/', validateQuery(listNotificationsQuerySchema), asyncHandler(ctrl.list));
router.post('/read-all', asyncHandler(ctrl.markAllRead));
router.post('/devices', validate(deviceSchema), asyncHandler(ctrl.registerDevice));
router.delete('/devices', validate(unregisterDeviceSchema), asyncHandler(ctrl.unregisterDevice));
router.post('/:id/read', asyncHandler(ctrl.markRead));

export default router;
