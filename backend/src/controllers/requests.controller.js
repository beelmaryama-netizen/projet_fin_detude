import * as requestsService from '../services/requests.service.js';

export async function create(req, res) {
  res.status(201).json(await requestsService.create(req.user.id, req.body));
}

export async function list(req, res) {
  res.json(await requestsService.list(req.user, req.validatedQuery));
}

export async function getOne(req, res) {
  res.json(await requestsService.getOne(req.user, req.params.id));
}

export async function cancel(req, res) {
  res.json(await requestsService.cancelByClient(req.user.id, req.params.id));
}

export async function updateStatus(req, res) {
  res.json(await requestsService.updateStatus(req.params.id, req.body.status));
}
