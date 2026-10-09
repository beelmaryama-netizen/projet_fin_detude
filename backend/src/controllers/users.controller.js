import * as usersService from '../services/users.service.js';

export async function list(req, res) {
  res.json(await usersService.listUsers(req.validatedQuery));
}

export async function getOne(req, res) {
  res.json(await usersService.getUser(req.params.id));
}

export async function createEmployee(req, res) {
  res.status(201).json(await usersService.createEmployee(req.body));
}

export async function updateStatus(req, res) {
  res.json(await usersService.updateStatus(req.params.id, req.body.status));
}

export async function resetPassword(req, res) {
  res.json(await usersService.resetEmployeePassword(req.params.id));
}

export async function updateMe(req, res) {
  res.json(await usersService.updateMe(req.user.id, req.body));
}
