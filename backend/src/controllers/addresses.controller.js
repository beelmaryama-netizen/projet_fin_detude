import * as addressesService from '../services/addresses.service.js';

export async function list(req, res) {
  res.json(await addressesService.listMine(req.user.id));
}

export async function getOne(req, res) {
  res.json(await addressesService.getOne(req.params.id, req.user.id));
}

export async function create(req, res) {
  res.status(201).json(await addressesService.create(req.user.id, req.body));
}

export async function update(req, res) {
  res.json(await addressesService.update(req.params.id, req.user.id, req.body));
}

export async function remove(req, res) {
  await addressesService.remove(req.params.id, req.user.id);
  res.status(204).end();
}
