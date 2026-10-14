import * as service from '../services/photos.service.js';

export async function signature(req, res) {
  res.json(await service.uploadSignature(req.user, req.body));
}

export async function addRequestPhoto(req, res) {
  res.status(201).json(await service.addRequestPhoto(req.user, req.params.requestId, req.body));
}

export async function listRequestPhotos(req, res) {
  res.json(await service.listRequestPhotos(req.user, req.params.requestId));
}

export async function removeRequestPhoto(req, res) {
  await service.removeRequestPhoto(req.user, req.params.requestId, req.params.photoId);
  res.status(204).end();
}

export async function addMissionPhoto(req, res) {
  res.status(201).json(await service.addMissionPhoto(req.user, req.params.missionId, req.body));
}

export async function listMissionPhotos(req, res) {
  res.json(await service.listMissionPhotos(req.user, req.params.missionId));
}
