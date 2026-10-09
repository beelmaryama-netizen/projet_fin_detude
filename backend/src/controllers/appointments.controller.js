import * as appointmentsService from '../services/appointments.service.js';

export async function list(req, res) {
  res.json(await appointmentsService.list(req.user, req.validatedQuery));
}

export async function getOne(req, res) {
  res.json(await appointmentsService.getOne(req.user, req.params.id));
}

export async function updateClientNotes(req, res) {
  res.json(await appointmentsService.updateClientNotes(req.user, req.params.id, req.body));
}

export async function confirm(req, res) {
  res.json(await appointmentsService.confirm(req.user.id, req.params.id, req.body));
}

export async function reschedule(req, res) {
  res.json(await appointmentsService.reschedule(req.user.id, req.params.id, req.body));
}

export async function cancel(req, res) {
  res.json(await appointmentsService.cancel(req.params.id));
}
