import * as quotesService from '../services/quotes.service.js';

export async function listForRequest(req, res) {
  res.json(await quotesService.listForRequest(req.user, req.params.requestId));
}

export async function getOne(req, res) {
  res.json(await quotesService.getOne(req.user, req.params.id));
}

export async function create(req, res) {
  res.status(201).json(await quotesService.create(req.user.id, req.params.requestId, req.body));
}

export async function update(req, res) {
  res.json(await quotesService.update(req.params.id, req.body));
}

export async function remove(req, res) {
  await quotesService.remove(req.params.id);
  res.status(204).end();
}

export async function send(req, res) {
  res.json(await quotesService.send(req.params.id, req.body));
}

export async function accept(req, res) {
  res.json(await quotesService.accept(req.user, req.params.id));
}

export async function reject(req, res) {
  res.json(await quotesService.reject(req.user, req.params.id));
}
