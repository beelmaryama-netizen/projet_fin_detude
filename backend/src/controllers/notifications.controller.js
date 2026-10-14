import * as service from '../services/notifications.service.js';

export async function list(req, res) {
  res.json(await service.listMine(req.user.id, req.validatedQuery));
}

export async function markRead(req, res) {
  await service.markRead(req.user.id, req.params.id);
  res.status(204).end();
}

export async function markAllRead(req, res) {
  await service.markAllRead(req.user.id);
  res.status(204).end();
}

export async function registerDevice(req, res) {
  res.status(201).json(await service.registerDevice(req.user.id, req.body));
}

export async function unregisterDevice(req, res) {
  await service.unregisterDevice(req.user.id, req.body.token);
  res.status(204).end();
}
