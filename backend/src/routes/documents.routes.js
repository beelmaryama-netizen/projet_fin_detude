import express from 'express';
import { z } from 'zod';
import { requireAuth, requirePasswordChanged } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as documents from '../services/documents.service.js';
export const documentFiles = express.Router();
documentFiles.post(
  '/upload',
  express.raw({
    type: ['application/pdf', 'application/octet-stream'],
    limit: '10mb',
  }),
  asyncHandler(async (req, res) =>
    res
      .status(201)
      .json(await documents.uploadDocument(req.query.ticket, req.body)),
  ),
);
documentFiles.get(
  '/read',
  asyncHandler(async (req, res) => {
    const file = await documents.readDocument(req.query.ticket);
    res
      .set('Cache-Control', 'private, no-store')
      .set(
        'Content-Disposition',
        "attachment; filename*=UTF-8''" + encodeURIComponent(file.name),
      )
      .type('application/pdf')
      .send(file.data);
  }),
);
const router = express.Router();
router.use(requireAuth, requirePasswordChanged);
router.get(
  '/requests/:id/documents',
  asyncHandler(async (req, res) =>
    res.json(await documents.listDocuments(req.user, req.params.id)),
  ),
);
router.post(
  '/requests/:id/documents/signature',
  validate(
    z.object({
      name: z.string().trim().min(1).max(255),
      clientKey: z.string().min(1).max(150),
    }),
  ),
  asyncHandler(async (req, res) =>
    res.json(
      await documents.documentSignature(req.user, req.params.id, req.body),
    ),
  ),
);
router.delete(
  '/requests/:id/documents/:documentId',
  asyncHandler(async (req, res) => {
    await documents.removeDocument(
      req.user,
      req.params.id,
      req.params.documentId,
    );
    res.status(204).end();
  }),
);
export default router;
