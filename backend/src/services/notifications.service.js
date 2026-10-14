import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { sendPush } from './push.service.js';

// Textes envoyés. Côté CLIENT, jamais le mot "mission" (dossier 1 et 14).
export const TEMPLATES = {
  QUOTE_SENT: () => ({ title: 'Nouvelle offre disponible', body: 'MagicPro vous a envoyé une offre pour votre demande.' }),
  QUOTE_ACCEPTED: () => ({ title: 'Offre acceptée', body: 'Un client a accepté une offre. Le rendez-vous est à confirmer.' }),
  QUOTE_REJECTED: () => ({ title: 'Offre refusée', body: 'Un client a refusé une offre. Une nouvelle version peut être envoyée.' }),
  APPOINTMENT_CONFIRMED: () => ({ title: 'Réservation confirmée', body: 'Votre rendez-vous est confirmé.' }),
  APPOINTMENT_RESCHEDULED: () => ({ title: 'Réservation modifiée', body: 'La date de votre rendez-vous a changé.' }),
  APPOINTMENT_CANCELLED: () => ({ title: 'Réservation annulée', body: 'Votre rendez-vous a été annulé.' }),
  SERVICE_STARTED: () => ({ title: 'Service en cours', body: 'Notre équipe a commencé le service.' }),
  SERVICE_COMPLETED: () => ({ title: 'Service terminé', body: 'Votre service est terminé. Merci de votre confiance.' }),
  MISSION_ASSIGNED: () => ({ title: 'Nouvelle mission assignée', body: 'Une mission vous a été assignée.' }),
  MISSION_UNASSIGNED: () => ({ title: 'Mission retirée', body: 'Vous avez été retiré d’une mission.' }),
  MISSION_CANCELLED: () => ({ title: 'Mission annulée', body: 'Une de vos missions a été annulée.' }),
  MISSION_COMPLETED: () => ({ title: 'Mission terminée', body: 'Une mission vient d’être clôturée.' }),
};

// Crée la notification en base puis tente le push.
// Ne lance JAMAIS d'erreur : une notification ratée ne doit pas casser l'action métier.
export async function notify(userIds, type, entity = {}) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return;

  try {
    const { title, body } = TEMPLATES[type]();
    await prisma.notification.createMany({
      data: ids.map((userId) => ({
        userId,
        type,
        title,
        body,
        relatedEntityType: entity.type ?? null,
        relatedEntityId: entity.id ?? null,
      })),
    });

    const devices = await prisma.deviceToken.findMany({ where: { userId: { in: ids } } });
    const invalid = await sendPush(
      devices.map((d) => d.token),
      { title, body, data: { type, entityType: entity.type ?? '', entityId: entity.id ?? '' } }
    );
    if (invalid.length) await prisma.deviceToken.deleteMany({ where: { token: { in: invalid } } });
  } catch (err) {
    console.error('[notify]', type, err.message);
  }
}

export async function notifyAdmins(type, entity) {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' }, select: { id: true } });
  return notify(admins.map((a) => a.id), type, entity);
}

// ================= API =================

export async function listMine(userId, { unreadOnly, page, pageSize }) {
  const where = { userId, ...(unreadOnly && { readAt: null }) };
  const [items, total, unread] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { items, total, unread, page, pageSize };
}

export async function markRead(userId, id) {
  const { count } = await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
  if (count === 0) {
    const exists = await prisma.notification.findFirst({ where: { id, userId } });
    if (!exists) throw new AppError(404, 'Notification introuvable');
  }
}

export async function markAllRead(userId) {
  await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}

// Un token appartient au dernier utilisateur connecté sur le téléphone
export function registerDevice(userId, { token, platform }) {
  return prisma.deviceToken.upsert({
    where: { token },
    update: { userId, platform },
    create: { userId, token, platform },
  });
}

export async function unregisterDevice(userId, token) {
  await prisma.deviceToken.deleteMany({ where: { token, userId } });
}
