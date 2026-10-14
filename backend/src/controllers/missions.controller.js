import * as missionsService from '../services/missions.service.js';

export async function list(req, res) {
  res.json(await missionsService.list(req.user, req.validatedQuery));
}

export async function getOne(req, res) {
  res.json(await missionsService.getOne(req.user, req.params.id));
}

export async function create(req, res) {
  res.status(201).json(await missionsService.create(req.user.id, req.body));
}

export async function update(req, res) {
  res.json(await missionsService.update(req.user.id, req.params.id, req.body));
}

export async function availableEmployees(req, res) {
  res.json(await missionsService.availableEmployees(req.params.id));
}

export async function assign(req, res) {
  res.json(await missionsService.assign(req.user.id, req.params.id, req.body));
}

export async function unassign(req, res) {
  res.json(await missionsService.unassign(req.user.id, req.params.id, req.params.employeeId));
}

export async function start(req, res) {
  res.json(await missionsService.start(req.user.id, req.params.id));
}

export async function complete(req, res) {
  res.json(await missionsService.complete(req.user.id, req.params.id, req.body));
}

export async function addChecklistItems(req, res) {
  res.status(201).json(await missionsService.addChecklistItems(req.user.id, req.params.id, req.body));
}

export async function removeChecklistItem(req, res) {
  await missionsService.removeChecklistItem(req.user.id, req.params.id, req.params.itemId);
  res.status(204).end();
}

export async function toggleChecklistItem(req, res) {
  res.json(await missionsService.toggleChecklistItem(req.user, req.params.id, req.params.itemId, req.body));
}
