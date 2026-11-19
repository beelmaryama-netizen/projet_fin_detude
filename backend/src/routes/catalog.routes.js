import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import {
  requireAuth,
  requirePasswordChanged,
  requireRole,
} from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
const router = Router();
router.use(requireAuth, requirePasswordChanged);
const fields = z.object({
  name: z.string().trim().min(2).max(150),
  category: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'MEDICAL']),
  description: z.string().trim().min(1).max(2000),
  active: z.boolean().default(true),
});
router.get(
  '/services',
  asyncHandler(async (req, res) =>
    res.json(
      await prisma.serviceCatalogItem.findMany({
        where: req.user.role === 'ADMIN' ? {} : { active: true },
        orderBy: { name: 'asc' },
      }),
    ),
  ),
);
router.post(
  '/services',
  requireRole('ADMIN'),
  validate(fields),
  asyncHandler(async (req, res) =>
    res
      .status(201)
      .json(await prisma.serviceCatalogItem.create({ data: req.body })),
  ),
);
router.patch(
  '/services/:id',
  requireRole('ADMIN'),
  validate(fields.partial().refine((v) => Object.keys(v).length > 0)),
  asyncHandler(async (req, res) => {
    if (
      !(await prisma.serviceCatalogItem.findUnique({
        where: { id: req.params.id },
      }))
    )
      throw new AppError(404, 'Service introuvable');
    res.json(
      await prisma.serviceCatalogItem.update({
        where: { id: req.params.id },
        data: req.body,
      }),
    );
  }),
);
router.delete(
  '/services/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const changed = await prisma.serviceCatalogItem.updateMany({
      where: { id: req.params.id },
      data: { active: false },
    });
    if (!changed.count) throw new AppError(404, 'Service introuvable');
    res.status(204).end();
  }),
);
export default router;
