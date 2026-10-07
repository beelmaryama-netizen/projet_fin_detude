import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { computeQuote } from '../utils/money.js';

// Statuts de demande où l'admin peut préparer une offre
const QUOTABLE_REQUEST_STATUSES = ['UNDER_REVIEW', 'AWAITING_CLIENT'];

const itemsInclude = { items: true };

// Le client ne voit pas les champs internes
function forClient(quote) {
  const { createdByAdminId, employeesNeeded, ...rest } = quote;
  return rest;
}

// Passe en EXPIRED les offres SENT dont la date est dépassée
async function expireOverdue(where = {}) {
  await prisma.quote.updateMany({
    where: { ...where, status: 'SENT', expiresAt: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  });
}

// Vérifie l'accès à une demande (client propriétaire ou admin)
async function getAccessibleRequest(user, requestId) {
  const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
  if (!request || (user.role === 'CLIENT' && request.clientId !== user.id)) {
    throw new AppError(404, 'Demande introuvable');
  }
  return request;
}

async function getQuoteForUser(user, id) {
  await expireOverdue({ id });
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { ...itemsInclude, request: { select: { clientId: true, status: true } } },
  });

  const hiddenFromClient =
    user.role === 'CLIENT' && (!quote || quote.request.clientId !== user.id || quote.status === 'DRAFT');
  if (!quote || hiddenFromClient) throw new AppError(404, 'Offre introuvable');
  return quote;
}

// ================= LECTURE =================

export async function listForRequest(user, requestId) {
  await getAccessibleRequest(user, requestId);
  await expireOverdue({ requestId });

  const quotes = await prisma.quote.findMany({
    where: {
      requestId,
      ...(user.role === 'CLIENT' && { status: { not: 'DRAFT' } }), // brouillons invisibles au client
    },
    orderBy: { version: 'desc' },
    include: itemsInclude,
  });

  return user.role === 'CLIENT' ? quotes.map(forClient) : quotes;
}

export async function getOne(user, id) {
  const { request, ...quote } = await getQuoteForUser(user, id);
  return user.role === 'CLIENT' ? forClient(quote) : quote;
}

// ================= ADMIN =================

export async function create(adminId, requestId, data) {
  const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new AppError(404, 'Demande introuvable');
  if (!QUOTABLE_REQUEST_STATUSES.includes(request.status)) {
    throw new AppError(409, `Impossible de créer une offre pour une demande ${request.status}`);
  }

  const accepted = await prisma.quote.count({ where: { requestId, status: 'ACCEPTED' } });
  if (accepted > 0) throw new AppError(409, 'Cette demande a déjà une offre acceptée');

  const { items, subtotal, taxes, total } = computeQuote(data.items);
  const last = await prisma.quote.findFirst({ where: { requestId }, orderBy: { version: 'desc' } });

  return prisma.quote.create({
    data: {
      requestId,
      createdByAdminId: adminId,
      version: (last?.version ?? 0) + 1,
      subtotal,
      taxes,
      total,
      estimatedMinutes: data.estimatedMinutes,
      employeesNeeded: data.employeesNeeded,
      items: { create: items },
    },
    include: itemsInclude,
  });
}

async function getDraft(id) {
  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote) throw new AppError(404, 'Offre introuvable');
  if (quote.status !== 'DRAFT') throw new AppError(409, 'Seul un brouillon (DRAFT) peut être modifié');
  return quote;
}

export async function update(id, data) {
  await getDraft(id);
  const { items: rawItems, ...fields } = data;

  // Si les lignes changent : on les remplace toutes et on recalcule les totaux
  if (rawItems) {
    const { items, subtotal, taxes, total } = computeQuote(rawItems);
    return prisma.quote.update({
      where: { id },
      data: {
        ...fields,
        subtotal,
        taxes,
        total,
        items: { deleteMany: {}, create: items },
      },
      include: itemsInclude,
    });
  }

  return prisma.quote.update({ where: { id }, data: fields, include: itemsInclude });
}

export async function remove(id) {
  await getDraft(id);
  await prisma.quote.delete({ where: { id } });
}

export async function send(id, { validDays }) {
  const quote = await getDraft(id);
  const request = await prisma.serviceRequest.findUnique({ where: { id: quote.requestId } });
  if (!QUOTABLE_REQUEST_STATUSES.includes(request.status)) {
    throw new AppError(409, `Impossible d'envoyer une offre pour une demande ${request.status}`);
  }

  const now = new Date();
  const [, sent] = await prisma.$transaction([
    // L'ancienne offre encore en attente est remplacée par la nouvelle version
    prisma.quote.updateMany({
      where: { requestId: quote.requestId, status: 'SENT' },
      data: { status: 'SUPERSEDED' },
    }),
    prisma.quote.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: now,
        expiresAt: new Date(now.getTime() + validDays * 86400000),
      },
      include: itemsInclude,
    }),
    prisma.serviceRequest.update({
      where: { id: quote.requestId },
      data: { status: 'AWAITING_CLIENT' },
    }),
  ]);

  // TODO module notifications : notifier le client "nouvelle offre disponible"
  return sent;
}

// ================= CLIENT =================

export async function accept(user, id) {
  const quote = await getQuoteForUser(user, id);
  if (quote.status === 'EXPIRED') throw new AppError(409, 'Cette offre a expiré');
  if (quote.status !== 'SENT') throw new AppError(409, `Impossible d'accepter une offre ${quote.status}`);

  return prisma.$transaction(async (tx) => {
    // Mise à jour conditionnelle : protège contre deux acceptations simultanées
    const { count } = await tx.quote.updateMany({
      where: { id, status: 'SENT' },
      data: { status: 'ACCEPTED', respondedAt: new Date() },
    });
    if (count === 0) throw new AppError(409, 'Offre déjà traitée');

    const alreadyAccepted = await tx.quote.count({
      where: { requestId: quote.requestId, status: 'ACCEPTED' },
    });
    if (alreadyAccepted > 1) throw new AppError(409, 'Cette demande a déjà une offre acceptée');

    await tx.serviceRequest.update({
      where: { id: quote.requestId },
      data: { status: 'SCHEDULING' },
    });

    // Séquence 7.2 étape 9 : quote = ACCEPTED + rendez-vous à confirmer
    // Règle 30 : le rendez-vous référence l'offre acceptée de la même demande
    await tx.serviceAppointment.create({
      data: {
        requestId: quote.requestId,
        acceptedQuoteId: id,
        status: 'PENDING_CONFIRMATION',
      },
    });

    // TODO module notifications : notifier l'admin
    const updated = await tx.quote.findUnique({ where: { id }, include: itemsInclude });
    return forClient(updated);
  });
}

export async function reject(user, id) {
  const quote = await getQuoteForUser(user, id);
  if (quote.status !== 'SENT') throw new AppError(409, `Impossible de refuser une offre ${quote.status}`);

  // Un refus ne ferme pas la demande : elle revient en analyse pour une nouvelle version
  const [, updated] = await prisma.$transaction([
    prisma.quote.updateMany({
      where: { id, status: 'SENT' },
      data: { status: 'REJECTED', respondedAt: new Date() },
    }),
    prisma.quote.findUnique({ where: { id }, include: itemsInclude }),
    prisma.serviceRequest.update({
      where: { id: quote.requestId },
      data: { status: 'UNDER_REVIEW' },
    }),
  ]);

  return forClient(updated);
}
