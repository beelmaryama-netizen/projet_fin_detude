import express from 'express';
import { readFile, storeFile, localFilesEnabled } from '../services/localFiles.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
const router = express.Router();
router.use((_req, _res, next) => localFilesEnabled() ? next() : next(new AppError(404, 'Route introuvable')));
router.post('/upload', express.raw({ type: ['image/jpeg','image/png','application/octet-stream'], limit: '10mb' }), asyncHandler(async (req, res) => { res.status(201).json(await storeFile(req.query.ticket, req.body)); }));
router.get('/read', asyncHandler(async (req, res) => { const file = await readFile(req.query.ticket); res.set('Cache-Control','private, max-age=60').type(file.type).send(file.data); }));
export default router;
