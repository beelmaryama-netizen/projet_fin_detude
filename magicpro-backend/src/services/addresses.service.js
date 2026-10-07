import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

// Vérifie que l'adresse existe ET appartient à l'utilisateur (ownership)
async function findOwned(id, userId) {
  const address = await prisma.address.findUnique({ where: { id } });
  // 404 même si l'adresse appartient à un autre : on ne révèle pas son existence
  if (!address || address.userId !== userId) throw new AppError(404, 'Adresse introuvable');
  return address;
}

export function listMine(userId) {
  return prisma.address.findMany({ where: { userId }, orderBy: { label: 'asc' } });
}

export function getOne(id, userId) {
  return findOwned(id, userId);
}

export function create(userId, data) {
  return prisma.address.create({ data: { ...data, userId } });
}

export async function update(id, userId, data) {
  await findOwned(id, userId);
  return prisma.address.update({ where: { id }, data });
}

export async function remove(id, userId) {
  await findOwned(id, userId);

  const used = await prisma.serviceRequest.count({ where: { addressId: id } });
  if (used > 0) {
    throw new AppError(409, 'Adresse liée à une demande, suppression impossible');
  }

  await prisma.address.delete({ where: { id } });
}
