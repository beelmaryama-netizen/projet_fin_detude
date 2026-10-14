import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { withUrls } from '../utils/photoUrl.js';
import { notify, notifyAdmins } from './notifications.service.js';

// Cycle de vie "Mission interne" (dossier 10.1)
const OPEN_STATUSES = ['TO_ASSIGN', 'PLANNED', 'IN_PROGRESS'];
const ASSIGNABLE = ['TO_ASSIGN', 'PLANNED'];

// ---------- Vues ----------

const adminInclude = {
  appointment: {
    include: {
      acceptedQuote: { select: { id: true, estimatedMinutes: true, employeesNeeded: true } },
      request: {
        include: {
          address: true,
          residentialDetails: true,
          businessDetails: true,
          client: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
      },
    },
  },
  assignments: {
    where: { status: 'ACTIVE' },
    include: { employee: { select: { id: true, firstName: true, lastName: true, phone: true } } },
  },
  logs: { orderBy: { createdAt: 'asc' } },
  checklistItems: { orderBy: { sortOrder: 'asc' } },
  photos: { orderBy: { createdAt: 'asc' } },
};

// L'employé voit ce qu'il faut pour travailler : horaire, adresse, détails, instructions.
// Pas de prix, pas de journal, pas d'infos commerciales.
const employeeInclude = {
  appointment: {
    select: {
      id: true,
      scheduledStart: true,
      scheduledEnd: true,
      status: true,
      clientNotes: true,
      request: {
        select: {
          requestType: true,
          description: true,
          address: true,
          residentialDetails: true,
          businessDetails: true,
        },
      },
    },
  },
  assignments: {
    where: { status: 'ACTIVE' },
    select: { employee: { select: { id: true, firstName: true, lastName: true } } },
  },
  checklistItems: { orderBy: { sortOrder: 'asc' } },
  photos: { orderBy: { createdAt: 'asc' } },
};

// Ajoute les URL signées des photos
function present(mission) {
  return mission && { ...mission, photos: withUrls(mission.photos) };
}

// ---------- Chevauchements (règle 32) ----------

// Renvoie les assignations actives des employés dont la mission chevauche [start, end[
export async function findConflicts(db, employeeIds, start, end, excludeMissionId) {
  if (!start || !end || employeeIds.length === 0) return [];
  return db.missionAssignment.findMany({
    where: {
      employeeId: { in: employeeIds },
      status: 'ACTIVE',
      ...(excludeMissionId && { missionId: { not: excludeMissionId } }),
      mission: {
        status: { in: OPEN_STATUSES },
        appointment: { scheduledStart: { lt: end }, scheduledEnd: { gt: start } },
      },
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
      mission: { select: { id: true, appointment: { select: { scheduledStart: true, scheduledEnd: true } } } },
    },
  });
}

function conflictError(conflicts) {
  const names = [...new Set(conflicts.map((c) => `${c.employee.firstName} ${c.employee.lastName}`))];
  const err = new AppError(409, `Chevauchement horaire : ${names.join(', ')}`, 'SCHEDULE_CONFLICT');
  return err;
}

// ---------- Lecture ----------

export async function list(user, { status, employeeId, from, to }) {
  const isEmployee = user.role === 'EMPLOYEE';

  const missions = await prisma.mission.findMany({
    where: {
      status,
      // Règle 27 : l'employé ne voit que les missions où il a une assignation active
      ...(isEmployee
        ? { assignments: { some: { employeeId: user.id, status: 'ACTIVE' } } }
        : employeeId && { assignments: { some: { employeeId, status: 'ACTIVE' } } }),
      ...((from || to) && { appointment: { scheduledStart: { gte: from, lte: to } } }),
    },
    orderBy: { appointment: { scheduledStart: 'asc' } },
    include: isEmployee ? employeeInclude : adminInclude,
  });
  return missions.map(present);
}

export async function getOne(user, id) {
  const isEmployee = user.role === 'EMPLOYEE';
  const mission = await prisma.mission.findFirst({
    where: {
      id,
      ...(isEmployee && { assignments: { some: { employeeId: user.id, status: 'ACTIVE' } } }),
    },
    include: isEmployee ? employeeInclude : adminInclude,
  });

  // 404 aussi pour une mission non assignée : on ne révèle pas son existence
  if (!mission) throw new AppError(404, 'Mission introuvable');
  return present(mission);
}

// ---------- ADMIN ----------

// Séquence 7.3 étapes 1-3 + règle 31
export async function create(adminId, { appointmentId, internalInstructions }) {
  const appointment = await prisma.serviceAppointment.findUnique({
    where: { id: appointmentId },
    include: { mission: true },
  });
  if (!appointment) throw new AppError(404, 'Réservation introuvable');
  if (!['CONFIRMED', 'IN_PROGRESS'].includes(appointment.status)) {
    throw new AppError(409, 'Une mission ne peut être créée que pour un rendez-vous confirmé');
  }
  if (appointment.mission) throw new AppError(409, 'Ce rendez-vous a déjà une mission');

  return prisma.mission.create({
    data: {
      appointmentId,
      internalInstructions,
      logs: { create: { actorUserId: adminId, eventType: 'CREATED' } },
    },
    include: adminInclude,
  });
}

export async function update(adminId, id, { internalInstructions }) {
  const mission = await prisma.mission.findUnique({ where: { id } });
  if (!mission) throw new AppError(404, 'Mission introuvable');
  if (!OPEN_STATUSES.includes(mission.status)) {
    throw new AppError(409, `Mission ${mission.status} non modifiable`);
  }

  return prisma.mission.update({
    where: { id },
    data: {
      internalInstructions,
      logs: { create: { actorUserId: adminId, eventType: 'INSTRUCTIONS_UPDATED' } },
    },
    include: adminInclude,
  });
}

// Employés actifs sans chevauchement sur le créneau de la mission (aide pour l'écran admin)
export async function availableEmployees(id) {
  const mission = await prisma.mission.findUnique({ where: { id }, include: { appointment: true } });
  if (!mission) throw new AppError(404, 'Mission introuvable');

  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE', status: 'ACTIVE' },
    select: { id: true, firstName: true, lastName: true, phone: true },
    orderBy: { firstName: 'asc' },
  });

  const { scheduledStart, scheduledEnd } = mission.appointment;
  const conflicts = await findConflicts(prisma, employees.map((e) => e.id), scheduledStart, scheduledEnd, id);
  const busy = new Set(conflicts.map((c) => c.employeeId));

  const assigned = await prisma.missionAssignment.findMany({
    where: { missionId: id, status: 'ACTIVE' },
    select: { employeeId: true },
  });
  const already = new Set(assigned.map((a) => a.employeeId));

  return employees.filter((e) => !busy.has(e.id) && !already.has(e.id));
}

// Séquence 7.3 étapes 4-7
export async function assign(adminId, id, { employeeIds }) {
  let added = [];
  const result = await prisma.$transaction(async (tx) => {
    const mission = await tx.mission.findUnique({ where: { id }, include: { appointment: true } });
    if (!mission) throw new AppError(404, 'Mission introuvable');
    if (!ASSIGNABLE.includes(mission.status)) {
      throw new AppError(409, `Impossible d'assigner une mission ${mission.status}`);
    }

    // Seulement des comptes EMPLOYÉ actifs
    const employees = await tx.user.findMany({
      where: { id: { in: employeeIds }, role: 'EMPLOYEE', status: 'ACTIVE' },
      select: { id: true },
    });
    if (employees.length !== employeeIds.length) {
      throw new AppError(400, 'Un ou plusieurs employés sont invalides ou suspendus');
    }

    const existing = await tx.missionAssignment.findMany({
      where: { missionId: id, status: 'ACTIVE', employeeId: { in: employeeIds } },
      select: { employeeId: true },
    });
    const already = new Set(existing.map((a) => a.employeeId));
    const toAdd = employeeIds.filter((e) => !already.has(e));
    if (toAdd.length === 0) throw new AppError(409, 'Ces employés sont déjà assignés');

    // Règle 32 : vérification des chevauchements AVANT l'assignation
    const { scheduledStart, scheduledEnd } = mission.appointment;
    const conflicts = await findConflicts(tx, toAdd, scheduledStart, scheduledEnd, id);
    if (conflicts.length > 0) throw conflictError(conflicts);

    await tx.missionAssignment.createMany({
      data: toAdd.map((employeeId) => ({ missionId: id, employeeId, assignedByAdminId: adminId })),
    });

    await tx.missionLog.createMany({
      data: toAdd.map((employeeId) => ({
        missionId: id,
        actorUserId: adminId,
        eventType: 'ASSIGNED',
        note: `employeeId=${employeeId}`,
      })),
    });

    // TO_ASSIGN -> PLANNED dès qu'il y a au moins un employé
    await tx.mission.update({ where: { id }, data: { status: 'PLANNED' } });

    added = toAdd;
    return tx.mission.findUnique({ where: { id }, include: adminInclude });
  });

  // Séquence 7.3 étape 8
  await notify(added, 'MISSION_ASSIGNED', { type: 'MISSION', id });
  return present(result);
}

export async function unassign(adminId, id, employeeId) {
  const result = await prisma.$transaction(async (tx) => {
    const mission = await tx.mission.findUnique({ where: { id } });
    if (!mission) throw new AppError(404, 'Mission introuvable');
    if (!ASSIGNABLE.includes(mission.status)) {
      throw new AppError(409, `Impossible de modifier l'équipe d'une mission ${mission.status}`);
    }

    const { count } = await tx.missionAssignment.updateMany({
      where: { missionId: id, employeeId, status: 'ACTIVE' },
      data: { status: 'REMOVED', removedAt: new Date() },
    });
    if (count === 0) throw new AppError(404, 'Assignation introuvable');

    await tx.missionLog.create({
      data: { missionId: id, actorUserId: adminId, eventType: 'UNASSIGNED', note: `employeeId=${employeeId}` },
    });

    // Plus personne : la mission revient à TO_ASSIGN
    const remaining = await tx.missionAssignment.count({ where: { missionId: id, status: 'ACTIVE' } });
    if (remaining === 0) {
      await tx.mission.update({ where: { id }, data: { status: 'TO_ASSIGN' } });
    }

    return tx.mission.findUnique({ where: { id }, include: adminInclude });
  });

  await notify([employeeId], 'MISSION_UNASSIGNED', { type: 'MISSION', id });
  return present(result);
}

// Appelé quand la réservation est annulée : la mission suit.
// Renvoie les employés libérés (pour les notifier après la transaction).
export async function cancelForAppointment(tx, appointmentId, actorUserId) {
  const mission = await tx.mission.findUnique({
    where: { appointmentId },
    include: { assignments: { where: { status: 'ACTIVE' } } },
  });
  if (!mission || !OPEN_STATUSES.includes(mission.status)) return { missionId: null, employeeIds: [] };

  await tx.mission.update({ where: { id: mission.id }, data: { status: 'CANCELLED' } });
  await tx.missionAssignment.updateMany({
    where: { missionId: mission.id, status: 'ACTIVE' },
    data: { status: 'REMOVED', removedAt: new Date() },
  });
  await tx.missionLog.create({
    data: { missionId: mission.id, actorUserId, eventType: 'CANCELLED', note: 'Réservation annulée' },
  });
  return { missionId: mission.id, employeeIds: mission.assignments.map((a) => a.employeeId) };
}

// ================= EXÉCUTION (séquence 7.4) =================

// L'employé doit avoir une assignation ACTIVE sur la mission (règle 27)
async function findAssigned(employeeId, id) {
  const mission = await prisma.mission.findFirst({
    where: { id, assignments: { some: { employeeId, status: 'ACTIVE' } } },
    include: { appointment: { include: { request: { select: { id: true, clientId: true } } } } },
  });
  if (!mission) throw new AppError(404, 'Mission introuvable');
  return mission;
}

// 7.4 étapes 3-5 : mission IN_PROGRESS + journal, réservation visible "En cours"
export async function start(employeeId, id) {
  const mission = await findAssigned(employeeId, id);
  if (mission.status !== 'PLANNED') throw new AppError(409, `Impossible de démarrer une mission ${mission.status}`);
  if (mission.appointment.status !== 'CONFIRMED') {
    throw new AppError(409, `Réservation ${mission.appointment.status}, démarrage impossible`);
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.mission.update({ where: { id }, data: { status: 'IN_PROGRESS', startedAt: now } }),
    prisma.serviceAppointment.update({ where: { id: mission.appointmentId }, data: { status: 'IN_PROGRESS' } }),
    prisma.missionLog.create({ data: { missionId: id, actorUserId: employeeId, eventType: 'STARTED' } }),
  ]);

  // Le client reçoit le statut du service, jamais la mission
  await notify([mission.appointment.request.clientId], 'SERVICE_STARTED', {
    type: 'APPOINTMENT',
    id: mission.appointmentId,
  });
  return getOne({ id: employeeId, role: 'EMPLOYEE' }, id);
}

// 7.4 étapes 8-10 : mission + rendez-vous COMPLETED, client notifié "service terminé"
export async function complete(employeeId, id, { note }) {
  const mission = await findAssigned(employeeId, id);
  if (mission.status !== 'IN_PROGRESS') throw new AppError(409, `Impossible de terminer une mission ${mission.status}`);

  const now = new Date();
  await prisma.$transaction([
    prisma.mission.update({ where: { id }, data: { status: 'COMPLETED', completedAt: now } }),
    prisma.serviceAppointment.update({ where: { id: mission.appointmentId }, data: { status: 'COMPLETED' } }),
    prisma.serviceRequest.update({ where: { id: mission.appointment.request.id }, data: { status: 'COMPLETED' } }),
    prisma.missionLog.create({ data: { missionId: id, actorUserId: employeeId, eventType: 'COMPLETED', note } }),
  ]);

  await notify([mission.appointment.request.clientId], 'SERVICE_COMPLETED', {
    type: 'APPOINTMENT',
    id: mission.appointmentId,
  });
  await notifyAdmins('MISSION_COMPLETED', { type: 'MISSION', id });
  return getOne({ id: employeeId, role: 'EMPLOYEE' }, id);
}

// ================= CHECKLIST =================

export async function addChecklistItems(adminId, id, { items }) {
  const mission = await prisma.mission.findUnique({ where: { id } });
  if (!mission) throw new AppError(404, 'Mission introuvable');
  if (!OPEN_STATUSES.includes(mission.status)) throw new AppError(409, `Mission ${mission.status} non modifiable`);

  const last = await prisma.missionChecklistItem.findFirst({ where: { missionId: id }, orderBy: { sortOrder: 'desc' } });
  const start = (last?.sortOrder ?? -1) + 1;

  await prisma.$transaction([
    prisma.missionChecklistItem.createMany({
      data: items.map((label, i) => ({ missionId: id, label, sortOrder: start + i })),
    }),
    prisma.missionLog.create({
      data: { missionId: id, actorUserId: adminId, eventType: 'CHECKLIST_UPDATED', note: `+${items.length}` },
    }),
  ]);
  return prisma.missionChecklistItem.findMany({ where: { missionId: id }, orderBy: { sortOrder: 'asc' } });
}

export async function removeChecklistItem(adminId, id, itemId) {
  const mission = await prisma.mission.findUnique({ where: { id } });
  if (!mission) throw new AppError(404, 'Mission introuvable');
  if (!OPEN_STATUSES.includes(mission.status)) throw new AppError(409, `Mission ${mission.status} non modifiable`);

  const { count } = await prisma.missionChecklistItem.deleteMany({ where: { id: itemId, missionId: id } });
  if (count === 0) throw new AppError(404, 'Élément introuvable');
  await prisma.missionLog.create({
    data: { missionId: id, actorUserId: adminId, eventType: 'CHECKLIST_UPDATED', note: '-1' },
  });
}

// Employé assigné (mission en cours) ou admin
export async function toggleChecklistItem(user, id, itemId, { isDone }) {
  const mission =
    user.role === 'EMPLOYEE'
      ? await findAssigned(user.id, id)
      : await prisma.mission.findUnique({ where: { id } });
  if (!mission) throw new AppError(404, 'Mission introuvable');
  if (user.role === 'EMPLOYEE' && mission.status !== 'IN_PROGRESS') {
    throw new AppError(409, 'La checklist se remplit pendant une mission en cours');
  }

  const item = await prisma.missionChecklistItem.findFirst({ where: { id: itemId, missionId: id } });
  if (!item) throw new AppError(404, 'Élément introuvable');

  const [updated] = await prisma.$transaction([
    prisma.missionChecklistItem.update({
      where: { id: itemId },
      data: isDone
        ? { isDone: true, doneById: user.id, doneAt: new Date() }
        : { isDone: false, doneById: null, doneAt: null },
    }),
    prisma.missionLog.create({
      data: {
        missionId: id,
        actorUserId: user.id,
        eventType: isDone ? 'CHECKLIST_CHECKED' : 'CHECKLIST_UNCHECKED',
        note: item.label,
      },
    }),
  ]);
  return updated;
}
