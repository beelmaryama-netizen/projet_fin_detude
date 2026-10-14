import {
  api,
  resetDb,
  createUser,
  createUserWithToken,
  createConfirmedAppointment,
  inDays,
  prisma,
} from './helpers.js';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// Créneau : jour J+5 de 10 h à 13 h (heures relatives)
const slot = (startH, endH, day = 5) => ({ start: inDays(day, startH), end: inDays(day, endH) });

async function createMission(admin, appointmentId) {
  const res = await api().post('/api/missions').set(auth(admin.token)).send({ appointmentId });
  return res.body;
}

describe('Missions', () => {
  test('ADMIN crée une mission pour un rendez-vous CONFIRMED (TO_ASSIGN), une seule par rendez-vous', async () => {
    const admin = await createUserWithToken({ role: 'ADMIN' });
    const appt = await createConfirmedAppointment(slot(10, 13));

    const res = await api()
      .post('/api/missions')
      .set(auth(admin.token))
      .send({ appointmentId: appt.id, internalInstructions: 'Apporter aspirateur pro' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('TO_ASSIGN');
    expect(res.body.logs[0].eventType).toBe('CREATED');

    const again = await api().post('/api/missions').set(auth(admin.token)).send({ appointmentId: appt.id });
    expect(again.status).toBe(409);
  });

  test('règle 31 : pas de mission pour un rendez-vous non confirmé', async () => {
    const admin = await createUserWithToken({ role: 'ADMIN' });
    const appt = await createConfirmedAppointment(slot(10, 13));
    await prisma.serviceAppointment.update({ where: { id: appt.id }, data: { status: 'PENDING_CONFIRMATION' } });

    const res = await api().post('/api/missions').set(auth(admin.token)).send({ appointmentId: appt.id });
    expect(res.status).toBe(409);
  });

  test('E2E 40 / 44 : seul l’employé assigné voit la mission', async () => {
    const admin = await createUserWithToken({ role: 'ADMIN' });
    const emp1 = await createUserWithToken({ role: 'EMPLOYEE' });
    const emp2 = await createUserWithToken({ role: 'EMPLOYEE' });
    const appt = await createConfirmedAppointment(slot(10, 13));
    const mission = await createMission(admin, appt.id);

    const assigned = await api()
      .post(`/api/missions/${mission.id}/assignments`)
      .set(auth(admin.token))
      .send({ employeeIds: [emp1.user.id] });
    expect(assigned.status).toBe(200);
    expect(assigned.body.status).toBe('PLANNED');

    const list1 = await api().get('/api/missions').set(auth(emp1.token));
    expect(list1.body).toHaveLength(1);
    expect(list1.body[0].appointment.request.address).toBeDefined();
    expect(list1.body[0].logs).toBeUndefined(); // pas de journal côté employé

    const list2 = await api().get('/api/missions').set(auth(emp2.token));
    expect(list2.body).toHaveLength(0);

    const one2 = await api().get(`/api/missions/${mission.id}`).set(auth(emp2.token));
    expect(one2.status).toBe(404);
  });

  test('un CLIENT n’a jamais accès aux missions (403)', async () => {
    const client = await createUserWithToken({ role: 'CLIENT' });
    const res = await api().get('/api/missions').set(auth(client.token));
    expect(res.status).toBe(403);
  });

  test('règle 32 : chevauchement refusé, créneau libre accepté', async () => {
    const admin = await createUserWithToken({ role: 'ADMIN' });
    const emp = await createUser({ role: 'EMPLOYEE' });

    const mA = await createMission(admin, (await createConfirmedAppointment(slot(10, 13))).id);
    const mB = await createMission(admin, (await createConfirmedAppointment(slot(12, 15))).id); // chevauche A
    const mC = await createMission(admin, (await createConfirmedAppointment(slot(13, 16))).id); // commence quand A finit

    const a = await api().post(`/api/missions/${mA.id}/assignments`).set(auth(admin.token)).send({ employeeIds: [emp.id] });
    expect(a.status).toBe(200);

    const b = await api().post(`/api/missions/${mB.id}/assignments`).set(auth(admin.token)).send({ employeeIds: [emp.id] });
    expect(b.status).toBe(409);
    expect(b.body.code).toBe('SCHEDULE_CONFLICT');

    const c = await api().post(`/api/missions/${mC.id}/assignments`).set(auth(admin.token)).send({ employeeIds: [emp.id] });
    expect(c.status).toBe(200);
  });

  test('available-employees exclut les employés occupés', async () => {
    const admin = await createUserWithToken({ role: 'ADMIN' });
    const busy = await createUser({ role: 'EMPLOYEE' });
    const free = await createUser({ role: 'EMPLOYEE' });

    const mA = await createMission(admin, (await createConfirmedAppointment(slot(10, 13))).id);
    await api().post(`/api/missions/${mA.id}/assignments`).set(auth(admin.token)).send({ employeeIds: [busy.id] });

    const mB = await createMission(admin, (await createConfirmedAppointment(slot(11, 12))).id);
    const res = await api().get(`/api/missions/${mB.id}/available-employees`).set(auth(admin.token));
    const ids = res.body.map((e) => e.id);
    expect(ids).toContain(free.id);
    expect(ids).not.toContain(busy.id);
  });

  test('on ne peut assigner qu’un compte EMPLOYÉ actif (400)', async () => {
    const admin = await createUserWithToken({ role: 'ADMIN' });
    const client = await createUser({ role: 'CLIENT' });
    const mission = await createMission(admin, (await createConfirmedAppointment(slot(10, 13))).id);

    const res = await api()
      .post(`/api/missions/${mission.id}/assignments`)
      .set(auth(admin.token))
      .send({ employeeIds: [client.id] });
    expect(res.status).toBe(400);
  });

  test('désassignation : retour à TO_ASSIGN et l’employé perd l’accès', async () => {
    const admin = await createUserWithToken({ role: 'ADMIN' });
    const emp = await createUserWithToken({ role: 'EMPLOYEE' });
    const mission = await createMission(admin, (await createConfirmedAppointment(slot(10, 13))).id);
    await api().post(`/api/missions/${mission.id}/assignments`).set(auth(admin.token)).send({ employeeIds: [emp.user.id] });

    const res = await api().delete(`/api/missions/${mission.id}/assignments/${emp.user.id}`).set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('TO_ASSIGN');

    const seen = await api().get(`/api/missions/${mission.id}`).set(auth(emp.token));
    expect(seen.status).toBe(404);

    const events = (await prisma.missionLog.findMany({ where: { missionId: mission.id } })).map((l) => l.eventType);
    expect(events).toEqual(expect.arrayContaining(['CREATED', 'ASSIGNED', 'UNASSIGNED']));
  });

  test('annuler la réservation annule la mission et libère les employés', async () => {
    const admin = await createUserWithToken({ role: 'ADMIN' });
    const emp = await createUser({ role: 'EMPLOYEE' });
    const appt = await createConfirmedAppointment(slot(10, 13));
    const mission = await createMission(admin, appt.id);
    await api().post(`/api/missions/${mission.id}/assignments`).set(auth(admin.token)).send({ employeeIds: [emp.id] });

    const res = await api().post(`/api/appointments/${appt.id}/cancel`).set(auth(admin.token));
    expect(res.status).toBe(200);

    const m = await prisma.mission.findUnique({ where: { id: mission.id } });
    expect(m.status).toBe('CANCELLED');
    const active = await prisma.missionAssignment.count({ where: { missionId: mission.id, status: 'ACTIVE' } });
    expect(active).toBe(0);
  });

  test('replanifier dans un créneau occupé par un employé assigné -> 409', async () => {
    const admin = await createUserWithToken({ role: 'ADMIN' });
    const emp = await createUser({ role: 'EMPLOYEE' });

    const mA = await createMission(admin, (await createConfirmedAppointment(slot(10, 13))).id);
    await api().post(`/api/missions/${mA.id}/assignments`).set(auth(admin.token)).send({ employeeIds: [emp.id] });

    const apptB = await createConfirmedAppointment(slot(15, 17));
    const mB = await createMission(admin, apptB.id);
    await api().post(`/api/missions/${mB.id}/assignments`).set(auth(admin.token)).send({ employeeIds: [emp.id] });

    const res = await api()
      .post(`/api/appointments/${apptB.id}/reschedule`)
      .set(auth(admin.token))
      .send({ scheduledStart: inDays(5, 11), scheduledEnd: inDays(5, 14) });
    expect(res.status).toBe(409);
  });
});
