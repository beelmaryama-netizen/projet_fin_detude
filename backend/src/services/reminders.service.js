import { checkPushReceipts } from './expoPush.service.js';
import { prisma } from '../config/prisma.js';
import { notify } from './notifications.service.js';
export async function runReminders(now = new Date()) {
  const appointments = await prisma.serviceAppointment.findMany({
    where: {
      status: 'CONFIRMED',
      scheduledStart: { gt: now, lte: new Date(+now + 24 * 3600000) },
    },
    include: {
      request: { select: { clientId: true } },
      mission: { include: { assignments: { where: { status: 'ACTIVE' } } } },
    },
  });
  for (const appointment of appointments) {
    const key = appointment.id + ':' + appointment.scheduledStart.toISOString();
    await notify([appointment.request.clientId], 'APPOINTMENT_REMINDER', {
      type: 'APPOINTMENT',
      id: appointment.id,
      dedupeKey: key,
    });
    if (
      appointment.mission &&
      ['PLANNED', 'TO_ASSIGN'].includes(appointment.mission.status)
    )
      await notify(
        appointment.mission.assignments.map((a) => a.employeeId),
        'MISSION_REMINDER',
        { type: 'MISSION', id: appointment.mission.id, dedupeKey: key },
      );
  }
  return appointments.length;
}
export function startReminders() {
  if (process.env.NODE_ENV === 'test') return () => {};
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      if (process.env.REMINDERS_ENABLED !== 'false') await runReminders();
      await checkPushReceipts();
    } catch (error) {
      console.error('[reminders]', error.code || 'unavailable');
    } finally {
      running = false;
    }
  };
  void tick();
  const timer = setInterval(() => void tick(), 60000);
  timer.unref();
  return () => clearInterval(timer);
}
