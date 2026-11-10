import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { findConflicts, getOne } from './missions.service.js';
import { notify } from './notifications.service.js';
import { withinHours } from '../utils/availability.js';
export async function replaceTeam(adminId, id, employeeIds) {
 let previousIds = [];
 await prisma.$transaction(async tx => {
  const mission = await tx.mission.findUnique({ where: { id }, include: { appointment: { include: { acceptedQuote: true } }, assignments: { where: { status: 'ACTIVE' } } } });
  if (!mission) throw new AppError(404, 'Mission introuvable');
  if (!['TO_ASSIGN','PLANNED'].includes(mission.status)) throw new AppError(409, 'Affectation non modifiable');
  if (employeeIds.length !== mission.appointment.acceptedQuote.employeesNeeded) throw new AppError(400, 'L’effectif doit correspondre à l’offre acceptée');
  const employees = await tx.user.findMany({ where: { id: { in: employeeIds }, role: 'EMPLOYEE', status: 'ACTIVE' } });
  if (employees.length !== employeeIds.length) throw new AppError(400, 'Employé invalide ou suspendu');
  const { scheduledStart, scheduledEnd } = mission.appointment;
  if (employees.some(e => !withinHours(e.employeeDetails?.workingHours, scheduledStart, scheduledEnd))) throw new AppError(409, 'Créneau hors des disponibilités d’un employé');
  if ((await findConflicts(tx, employeeIds, scheduledStart, scheduledEnd, id)).length) throw new AppError(409, 'Conflit horaire');
  previousIds = mission.assignments.map(a => a.employeeId);
  await tx.missionAssignment.updateMany({ where: { missionId: id, status: 'ACTIVE', employeeId: { notIn: employeeIds } }, data: { status: 'REMOVED', removedAt: new Date() } });
  const added = employeeIds.filter(employeeId => !previousIds.includes(employeeId));
  if (added.length) await tx.missionAssignment.createMany({ data: added.map(employeeId => ({ missionId: id, employeeId, assignedByAdminId: adminId })) });
  await tx.mission.update({ where: { id }, data: { status: 'PLANNED' } });
  await tx.missionLog.create({ data: { missionId: id, actorUserId: adminId, eventType: 'TEAM_UPDATED', note: employeeIds.join(',') } });
 }, { isolationLevel: 'Serializable' });
 await notify(employeeIds.filter(e => !previousIds.includes(e)), 'MISSION_ASSIGNED', { type: 'MISSION', id });
 await notify(previousIds.filter(e => !employeeIds.includes(e)), 'MISSION_UNASSIGNED', { type: 'MISSION', id });
 return getOne({ id: adminId, role: 'ADMIN' }, id);
}
