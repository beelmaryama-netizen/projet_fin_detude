import { Router } from 'express';
import * as ctrl from '../controllers/quotes.controller.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth, requireRole, requirePasswordChanged } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createQuoteSchema,
  updateQuoteSchema,
  sendQuoteSchema,
} from '../validators/quotes.validator.js';

const router = Router();

// Middlewares appliqués route par route (ce router est monté à la racine de /api)
const auth = [requireAuth, requirePasswordChanged];
const clientOrAdmin = [...auth, requireRole('CLIENT', 'ADMIN')];
const admin = [...auth, requireRole('ADMIN')];
const client = [...auth, requireRole('CLIENT')];

// Offres d'une demande
router.get('/requests/:requestId/quotes', clientOrAdmin, asyncHandler(ctrl.listForRequest));
router.post('/requests/:requestId/quotes', admin, validate(createQuoteSchema), asyncHandler(ctrl.create));

// Une offre
router.get('/quotes/:id', clientOrAdmin, asyncHandler(ctrl.getOne));
router.patch('/quotes/:id', admin, validate(updateQuoteSchema), asyncHandler(ctrl.update));
router.delete('/quotes/:id', admin, asyncHandler(ctrl.remove));
router.post('/quotes/:id/send', admin, validate(sendQuoteSchema), asyncHandler(ctrl.send));

// Réponse du client
router.post('/quotes/:id/accept', client, asyncHandler(ctrl.accept));
router.post('/quotes/:id/reject', client, asyncHandler(ctrl.reject));

export default router;
