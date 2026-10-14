import { prisma } from '../config/prisma.js';
import { cloudinary } from '../config/cloudinary.js';
import { AppError } from '../utils/AppError.js';
import { withUrls } from '../utils/photoUrl.js';

const MAX_REQUEST_PHOTOS = 10;
const REQUEST_PHOTO_EDITABLE = ['NEW', 'UNDER_REVIEW', 'AWAITING_CLIENT'];

const folderFor = (target, id) => `magicpro/${target === 'REQUEST' ? 'requests' : 'missions'}/${id}`;

// ---------- Accès ----------

async function ownedRequest(user, requestId) {
  const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
  if (!request || (user.role === 'CLIENT' && request.clientId !== user.id)) {
    throw new AppError(404, 'Demande introuvable');
  }
  return request;
}

async function accessibleMission(user, missionId) {
  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      ...(user.role === 'EMPLOYEE' && { assignments: { some: { employeeId: user.id, status: 'ACTIVE' } } }),
    },
  });
  if (!mission) throw new AppError(404, 'Mission introuvable');
  return mission;
}

// ---------- Signature d'upload ----------
// Le mobile envoie le fichier directement à Cloudinary avec cette signature :
// l'API ne fait jamais transiter l'image, elle ne stocke que la clé.
export async function uploadSignature(user, { target, id }) {
  if (target === 'REQUEST') {
    if (user.role !== 'CLIENT') throw new AppError(403, 'Accès refusé');
    await ownedRequest(user, id);
  } else {
    if (user.role === 'CLIENT') throw new AppError(403, 'Accès refusé');
    await accessibleMission(user, id);
  }

  const folder = folderFor(target, id);
  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder, type: 'authenticated' };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);

  return {
    ...params,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
  };
}

// La clé doit venir du dossier signé pour CETTE ressource
function checkKey(fileKey, target, id) {
  if (!fileKey.startsWith(`${folderFor(target, id)}/`)) {
    throw new AppError(400, 'fileKey invalide pour cette ressource');
  }
}

// ---------- Photos de demande (client propriétaire + admin) ----------

export async function addRequestPhoto(user, requestId, { fileKey, caption }) {
  const request = await ownedRequest(user, requestId);
  if (!REQUEST_PHOTO_EDITABLE.includes(request.status)) {
    throw new AppError(409, `Photos non modifiables pour une demande ${request.status}`);
  }
  checkKey(fileKey, 'REQUEST', requestId);

  const count = await prisma.requestPhoto.count({ where: { requestId } });
  if (count >= MAX_REQUEST_PHOTOS) throw new AppError(409, `Maximum ${MAX_REQUEST_PHOTOS} photos par demande`);

  const photo = await prisma.requestPhoto.create({
    data: { requestId, fileKey, caption, sortOrder: count },
  });
  return withUrls([photo])[0];
}

export async function listRequestPhotos(user, requestId) {
  await ownedRequest(user, requestId);
  const photos = await prisma.requestPhoto.findMany({ where: { requestId }, orderBy: { sortOrder: 'asc' } });
  return withUrls(photos);
}

export async function removeRequestPhoto(user, requestId, photoId) {
  const request = await ownedRequest(user, requestId);
  if (!REQUEST_PHOTO_EDITABLE.includes(request.status)) {
    throw new AppError(409, `Photos non modifiables pour une demande ${request.status}`);
  }
  const { count } = await prisma.requestPhoto.deleteMany({ where: { id: photoId, requestId } });
  if (count === 0) throw new AppError(404, 'Photo introuvable');
  // Le fichier Cloudinary peut être supprimé plus tard (politique de rétention à décider, dossier 16)
}

// ---------- Photos de mission (employé assigné + admin, JAMAIS le client : règle 33) ----------

export async function addMissionPhoto(user, missionId, { fileKey, caption, photoType }) {
  const mission = await accessibleMission(user, missionId);
  if (user.role === 'EMPLOYEE' && mission.status !== 'IN_PROGRESS') {
    throw new AppError(409, 'Les photos se prennent pendant une mission en cours');
  }
  if (['CANCELLED'].includes(mission.status)) throw new AppError(409, 'Mission annulée');
  checkKey(fileKey, 'MISSION', missionId);

  const [photo] = await prisma.$transaction([
    prisma.missionPhoto.create({
      data: { missionId, employeeId: user.id, fileKey, caption, photoType },
    }),
    prisma.missionLog.create({
      data: { missionId, actorUserId: user.id, eventType: 'PHOTO_ADDED', note: photoType },
    }),
  ]);
  return withUrls([photo])[0];
}

export async function listMissionPhotos(user, missionId) {
  await accessibleMission(user, missionId);
  const photos = await prisma.missionPhoto.findMany({ where: { missionId }, orderBy: { createdAt: 'asc' } });
  return withUrls(photos);
}
