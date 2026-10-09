import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

// Transitions autorisées pour l'admin (cycle de vie du dossier de référence)
// Certaines seront automatiques plus tard (offre envoyée -> AWAITING_CLIENT, etc.)
const TRANSITIONS = {
  NEW: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['AWAITING_CLIENT', 'CANCELLED', 'CLOSED'],
  AWAITING_CLIENT: ['UNDER_REVIEW', 'SCHEDULING', 'CANCELLED', 'CLOSED'],
  SCHEDULING: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['CLOSED'],
  CANCELLED: [],
  CLOSED: [],
};

// Statuts où le client peut encore annuler lui-même
const CLIENT_CANCELLABLE = ['NEW', 'UNDER_REVIEW', 'AWAITING_CLIENT'];

const detailInclude = {
  address: true,
  residentialDetails: true,
  businessDetails: true,
  availabilities: { orderBy: { priority: 'asc' } },
  photos: { orderBy: { sortOrder: 'asc' } },
};

export async function create(clientId, data) {
  const { requestType, addressId, description, availabilities, residential, business } = data;

  // L'adresse doit appartenir au client
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== clientId) throw new AppError(404, 'Adresse introuvable');

  // Création imbriquée = une seule transaction (tout ou rien)
  return prisma.serviceRequest.create({
    data: {
      clientId,
      addressId,
      requestType,
      description,
      availabilities: { create: availabilities },
      ...(requestType === 'RESIDENTIAL' && { residentialDetails: { create: residential } }),
      ...(requestType === 'BUSINESS' && { businessDetails: { create: business } }),
    },
    include: detailInclude,
  });
}

// CLIENT : uniquement ses demandes. ADMIN : toutes.
export async function list(user, { status, requestType, page, pageSize }) {
  const where = {
    status,
    requestType,
    ...(user.role === 'CLIENT' && { clientId: user.id }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        address: { select: { label: true, city: true } },
        ...(user.role === 'ADMIN' && {
          client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        }),
      },
    }),
    prisma.serviceRequest.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getOne(user, id) {
  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      ...detailInclude,
      ...(user.role === 'ADMIN' && {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      }),
    },
  });

  // 404 aussi si la demande appartient à un autre client
  if (!request || (user.role === 'CLIENT' && request.clientId !== user.id)) {
    throw new AppError(404, 'Demande introuvable');
  }
  return request;
}

export async function cancelByClient(clientId, id) {
  const request = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!request || request.clientId !== clientId) throw new AppError(404, 'Demande introuvable');

  if (!CLIENT_CANCELLABLE.includes(request.status)) {
    throw new AppError(409, `Impossible d'annuler une demande au statut ${request.status}`);
  }

  return prisma.serviceRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
}

export async function updateStatus(id, newStatus) {
  const request = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!request) throw new AppError(404, 'Demande introuvable');

  if (!TRANSITIONS[request.status].includes(newStatus)) {
    throw new AppError(409, `Transition interdite : ${request.status} -> ${newStatus}`);
  }

  return prisma.serviceRequest.update({ where: { id }, data: { status: newStatus } });
}
