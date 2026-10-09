import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

// Cycle de vie "Réservation" du dossier (10.1).
// IN_PROGRESS et COMPLETED sont pilotés par la mission (séquence 7.4), pas par cette API.
const CANCELLABLE = ['PENDING_CONFIRMATION', 'CONFIRMED'];
const NOTES_EDITABLE = ['PENDING_CONFIRMATION', 'CONFIRMED'];

const baseInclude = {
  request: {
    select: {
      id: true,
      clientId: true,
      requestType: true,
      address: true,
    },
  },
  acceptedQuote: { select: { id: true, version: true, total: true } },
};

// Le client ne voit pas qui a confirmé (champ interne)
function forClient(appointment) {
  const { confirmedByAdminId, ...rest } = appointment;
  return rest;
}

async function findForUser(user, id) {
  const appointment = await prisma.serviceAppointment.findUnique({
    where: { id },
    include: baseInclude,
  });

  // Règle 26 : le client ne voit que ses réservations (404 sinon)
  if (!appointment || (user.role === 'CLIENT' && appointment.request.clientId !== user.id)) {
    throw new AppError(404, 'Réservation introuvable');
  }
  return appointment;
}

// ================= LECTURE (CLIENT + ADMIN) =================

export async function list(user, { status, from, to }) {
  const appointments = await prisma.serviceAppointment.findMany({
    where: {
      status,
      ...((from || to) && { scheduledStart: { gte: from, lte: to } }),
      ...(user.role === 'CLIENT' && { request: { clientId: user.id } }),
    },
    orderBy: { scheduledStart: 'asc' },
    include: {
      ...baseInclude,
      ...(user.role === 'ADMIN' && {
        request: {
          select: {
            id: true,
            clientId: true,
            requestType: true,
            address: true,
            client: { select: { id: true, firstName: true, lastName: true, phone: true } },
          },
        },
      }),
    },
  });

  return user.role === 'CLIENT' ? appointments.map(forClient) : appointments;
}

export async function getOne(user, id) {
  const appointment = await findForUser(user, id);
  return user.role === 'CLIENT' ? forClient(appointment) : appointment;
}

// ================= CLIENT =================

export async function updateClientNotes(user, id, { clientNotes }) {
  const appointment = await findForUser(user, id);
  if (!NOTES_EDITABLE.includes(appointment.status)) {
    throw new AppError(409, `Notes non modifiables pour une réservation ${appointment.status}`);
  }

  const updated = await prisma.serviceAppointment.update({
    where: { id },
    data: { clientNotes },
    include: baseInclude,
  });
  return forClient(updated);
}

// ================= ADMIN =================

// Séquence 7.2 étapes 10-11 : l'admin confirme date et heure -> CONFIRMED
export async function confirm(adminId, id, { scheduledStart, scheduledEnd }) {
  const appointment = await prisma.serviceAppointment.findUnique({
    where: { id },
    include: { acceptedQuote: true },
  });
  if (!appointment) throw new AppError(404, 'Réservation introuvable');
  if (appointment.status !== 'PENDING_CONFIRMATION') {
    throw new AppError(409, `Impossible de confirmer une réservation ${appointment.status}`);
  }

  // Règle 30 : l'offre doit être ACCEPTED et appartenir à la même demande
  const quote = appointment.acceptedQuote;
  if (quote.status !== 'ACCEPTED' || quote.requestId !== appointment.requestId) {
    throw new AppError(409, 'La réservation doit référencer une offre acceptée de la même demande');
  }

  const [updated] = await prisma.$transaction([
    prisma.serviceAppointment.update({
      where: { id },
      data: { status: 'CONFIRMED', scheduledStart, scheduledEnd, confirmedByAdminId: adminId },
      include: baseInclude,
    }),
    prisma.serviceRequest.update({
      where: { id: appointment.requestId },
      data: { status: 'ACTIVE' },
    }),
  ]);

  // TODO module notifications : notifier le client "réservation confirmée"
  return updated;
}

// Matrice des permissions : confirmer / replanifier = ADMIN
export async function reschedule(adminId, id, { scheduledStart, scheduledEnd }) {
  const appointment = await prisma.serviceAppointment.findUnique({ where: { id } });
  if (!appointment) throw new AppError(404, 'Réservation introuvable');
  if (appointment.status !== 'CONFIRMED') {
    throw new AppError(409, 'Seule une réservation CONFIRMED peut être replanifiée');
  }

  // TODO module missions : vérifier les chevauchements des employés déjà assignés (règle 32)
  return prisma.serviceAppointment.update({
    where: { id },
    data: { scheduledStart, scheduledEnd, confirmedByAdminId: adminId },
    include: baseInclude,
  });
}

export async function cancel(id) {
  const appointment = await prisma.serviceAppointment.findUnique({ where: { id } });
  if (!appointment) throw new AppError(404, 'Réservation introuvable');
  if (!CANCELLABLE.includes(appointment.status)) {
    throw new AppError(409, `Impossible d'annuler une réservation ${appointment.status}`);
  }

  const [updated] = await prisma.$transaction([
    prisma.serviceAppointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: baseInclude,
    }),
    prisma.serviceRequest.update({
      where: { id: appointment.requestId },
      data: { status: 'CANCELLED' },
    }),
  ]);

  // TODO module notifications : notifier le client
  return updated;
}
