import { Router } from 'express';
import * as ctrl from '../controllers/photos.controller.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth, requireRole, requirePasswordChanged } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signatureSchema, requestPhotoSchema, missionPhotoSchema } from '../validators/photos.validator.js';

const router = Router();

// Monté à la racine de /api : middlewares appliqués route par route
const auth = [requireAuth, requirePasswordChanged];
const client = [...auth, requireRole('CLIENT')];
const clientOrAdmin = [...auth, requireRole('CLIENT', 'ADMIN')];
const staff = [...auth, requireRole('EMPLOYEE', 'ADMIN')];

router.post('/uploads/signature', auth, validate(signatureSchema), asyncHandler(ctrl.signature));

// Photo de demande : client propriétaire + admin (glossaire)
router.get('/requests/:requestId/photos', clientOrAdmin, asyncHandler(ctrl.listRequestPhotos));
router.post('/requests/:requestId/photos', client, validate(requestPhotoSchema), asyncHandler(ctrl.addRequestPhoto));
router.delete('/requests/:requestId/photos/:photoId', client, asyncHandler(ctrl.removeRequestPhoto));

// Photo de mission : employé concerné + admin (règle 33)
router.get('/missions/:missionId/photos', staff, asyncHandler(ctrl.listMissionPhotos));
router.post('/missions/:missionId/photos', staff, validate(missionPhotoSchema), asyncHandler(ctrl.addMissionPhoto));

export default router;
