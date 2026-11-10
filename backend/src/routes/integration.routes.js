import { replaceTeam } from '../services/team.service.js';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth, requirePasswordChanged, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import * as appointments from '../services/appointments.service.js';
import * as photos from '../services/photos.service.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';
const router = Router();
router.use(requireAuth, requirePasswordChanged);
const preferences = z.object({ newQuotes: z.boolean().optional(), bookingConfirmations: z.boolean().optional(), bookingChanges: z.boolean().optional(), reminders: z.boolean().optional(), assignments: z.boolean().optional(), changes: z.boolean().optional() });
router.get('/preferences', asyncHandler(async (req, res) => {
 const user = await prisma.user.findUnique({ where: { id: req.user.id } });
 res.json(user.notificationPreferences ?? { newQuotes: true, bookingConfirmations: true, bookingChanges: true, reminders: true, assignments: true, changes: true });
}));
router.put('/preferences', validate(preferences), asyncHandler(async (req, res) => {
 const user = await prisma.user.update({ where: { id: req.user.id }, data: { notificationPreferences: req.body } }); res.json(user.notificationPreferences);
}));
const details = z.object({ city: z.string().max(120), specialties: z.array(z.string().max(100)).max(30), availability: z.string().max(500), workingHours: z.object({ days: z.array(z.number().int().min(0).max(6)).min(1), start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) }).refine(v => v.end > v.start).optional() });
router.patch('/users/:id/employee-profile', requireRole('ADMIN'), validate(z.object({ firstName: z.string().min(1).max(100), lastName: z.string().min(1).max(100), email: z.string().trim().toLowerCase().email(), phone: z.string().max(30), employeeDetails: details })), asyncHandler(async (req, res) => {
 const user = await prisma.user.findUnique({ where: { id: req.params.id } });
 if (!user || user.role !== 'EMPLOYEE') throw new AppError(404, 'Employé introuvable');
 res.json(sanitizeUser(await prisma.user.update({ where: { id: user.id }, data: req.body })));
}));
router.post('/appointments/:id/client-cancel', requireRole('CLIENT'), asyncHandler(async (req, res) => {
 const appointment = await appointments.getOne(req.user, req.params.id);
 if (appointment.scheduledStart && new Date(appointment.scheduledStart).getTime() - Date.now() < 86400000) throw new AppError(409, 'Contactez le support : moins de 24 heures avant le rendez-vous.');
 await appointments.cancel(req.user.id, req.params.id); res.status(204).end();
}));
router.delete('/missions/:id/photos/:photoId', requireRole('EMPLOYEE', 'ADMIN'), asyncHandler(async (req, res) => { await photos.removeMissionPhoto(req.user, req.params.id, req.params.photoId); res.status(204).end(); }));
router.get('/support', asyncHandler(async (req, res) => res.json(await prisma.supportTicket.findMany({ where: req.user.role === 'ADMIN' ? {} : { ownerId: req.user.id }, orderBy: { createdAt: 'desc' } }))));
router.post('/support', validate(z.object({ subject: z.string().trim().min(2).max(150), message: z.string().trim().min(2).max(2000), requestId: z.string().uuid().optional(), quoteId: z.string().uuid().optional(), reservationId: z.string().uuid().optional(), missionId: z.string().uuid().optional() })), asyncHandler(async (req, res) => {
 const { requestId, quoteId, reservationId, missionId, subject, message } = req.body;
 if (req.user.role === 'CLIENT') {
  if (missionId) throw new AppError(403, 'Accès refusé');
  if (requestId && !await prisma.serviceRequest.findFirst({ where: { id: requestId, clientId: req.user.id } })) throw new AppError(404, 'Demande introuvable');
  if (quoteId && !await prisma.quote.findFirst({ where: { id: quoteId, status: { not: 'DRAFT' }, request: { clientId: req.user.id } } })) throw new AppError(404, 'Offre introuvable');
  if (reservationId && !await prisma.serviceAppointment.findFirst({ where: { id: reservationId, request: { clientId: req.user.id } } })) throw new AppError(404, 'Réservation introuvable');
 }
 if (req.user.role === 'EMPLOYEE') {
  if (requestId || quoteId || reservationId) throw new AppError(403, 'Accès refusé');
  if (missionId && !await prisma.mission.findFirst({ where: { id: missionId, assignments: { some: { employeeId: req.user.id, status: 'ACTIVE' } } } })) throw new AppError(404, 'Mission introuvable');
 }
 const user = await prisma.user.findUnique({ where: { id: req.user.id } });
 const ticket = await prisma.supportTicket.create({ data: { ownerId: user.id, author: user.firstName + ' ' + user.lastName, role: user.role, subject, message, reference: reservationId ?? quoteId ?? requestId ?? missionId } });
 res.status(201).json({ reference: ticket.id });
}));
router.put('/support/:id/reply', requireRole('ADMIN'), validate(z.object({ reply: z.string().trim().min(2).max(2000) })), asyncHandler(async (req, res) => res.json(await prisma.supportTicket.update({ where: { id: req.params.id }, data: { reply: req.body.reply } }))));
const settingsSchema = z.object({ companyName: z.string().trim().min(1).max(150), contactEmail: z.string().email(), contactPhone: z.string().max(30), defaultTaxPercent: z.number().min(0).max(30), defaultValidityHours: z.number().int().min(1).max(2160), notifyNewRequests: z.boolean() });
router.get('/admin/settings', requireRole('ADMIN'), asyncHandler(async (_req, res) => res.json((await prisma.appSetting.findUnique({ where: { id: 'company' } }))?.value ?? { companyName: 'MagicPro', contactEmail: 'contact@magicpro.ca', contactPhone: '', defaultTaxPercent: 14.975, defaultValidityHours: 48, notifyNewRequests: true })));
router.put('/admin/settings', requireRole('ADMIN'), validate(settingsSchema), asyncHandler(async (req, res) => res.json((await prisma.appSetting.upsert({ where: { id: 'company' }, create: { id: 'company', value: req.body }, update: { value: req.body } })).value)));
router.put('/missions/:id/team', requireRole('ADMIN'), validate(z.object({ employeeIds: z.array(z.string().uuid()).min(1).max(50).refine(ids => new Set(ids).size === ids.length) })), asyncHandler(async (req, res) => res.json(await replaceTeam(req.user.id, req.params.id, req.body.employeeIds))));
export default router;
