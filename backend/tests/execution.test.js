import {
  api,
  resetDb,
  createUserWithToken,
  createConfirmedAppointment,
  inDays,
  prisma,
} from './helpers.js';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// Rendez-vous CONFIRMED + mission + employé assigné + checklist
async function setupPlanned() {
  const admin = await createUserWithToken({ role: 'ADMIN' });
  const emp = await createUserWithToken({ role: 'EMPLOYEE' });
  const appt = await createConfirmedAppointment({ start: inDays(3, 9), end: inDays(3, 12) });

  const mission = (await api().post('/api/missions').set(auth(admin.token)).send({ appointmentId: appt.id })).body;
  await api().post(`/api/missions/${mission.id}/assignments`).set(auth(admin.token)).send({ employeeIds: [emp.user.id] });
  const items = (
    await api()
      .post(`/api/missions/${mission.id}/checklist`)
      .set(auth(admin.token))
      .send({ items: ['Cuisine', 'Salle de bain', 'Sols'] })
  ).body;

  const request = await prisma.serviceRequest.findUnique({ where: { id: appt.requestId } });
  return { admin, emp, appt, mission, items, clientId: request.clientId };
}

describe('Exécution des missions (séquence 7.4)', () => {
  test('E2E 41 : démarrer, cocher la checklist, photo, terminer', async () => {
    const { emp, appt, mission, items, clientId } = await setupPlanned();

    // Démarrer
    const started = await api().post(`/api/missions/${mission.id}/start`).set(auth(emp.token));
    expect(started.status).toBe(200);
    expect(started.body.status).toBe('IN_PROGRESS');
    expect((await prisma.serviceAppointment.findUnique({ where: { id: appt.id } })).status).toBe('IN_PROGRESS');

    // Checklist
    const checked = await api()
      .patch(`/api/missions/${mission.id}/checklist/${items[0].id}`)
      .set(auth(emp.token))
      .send({ isDone: true });
    expect(checked.status).toBe(200);
    expect(checked.body.isDone).toBe(true);
    expect(checked.body.doneById).toBe(emp.user.id);

    // Photo AFTER (clé dans le dossier signé de la mission)
    const photo = await api()
      .post(`/api/missions/${mission.id}/photos`)
      .set(auth(emp.token))
      .send({ fileKey: `magicpro/missions/${mission.id}/apres-cuisine`, photoType: 'AFTER' });
    expect(photo.status).toBe(201);
    expect(photo.body.url).toContain('authenticated');

    // Terminer
    const done = await api()
      .post(`/api/missions/${mission.id}/complete`)
      .set(auth(emp.token))
      .send({ note: 'RAS' });
    expect(done.status).toBe(200);
    expect(done.body.status).toBe('COMPLETED');

    const a = await prisma.serviceAppointment.findUnique({ where: { id: appt.id } });
    const r = await prisma.serviceRequest.findUnique({ where: { id: appt.requestId } });
    expect(a.status).toBe('COMPLETED');
    expect(r.status).toBe('COMPLETED');

    // Règle 34 : tout est journalisé
    const events = (await prisma.missionLog.findMany({ where: { missionId: mission.id } })).map((l) => l.eventType);
    expect(events).toEqual(
      expect.arrayContaining(['CREATED', 'ASSIGNED', 'STARTED', 'CHECKLIST_CHECKED', 'PHOTO_ADDED', 'COMPLETED'])
    );

    // Le client est notifié du service, sans le mot "mission"
    const notifs = await prisma.notification.findMany({ where: { userId: clientId } });
    const types = notifs.map((n) => n.type);
    expect(types).toEqual(expect.arrayContaining(['SERVICE_STARTED', 'SERVICE_COMPLETED']));
    notifs.forEach((n) => expect(`${n.title} ${n.body}`.toLowerCase()).not.toContain('mission'));
  });

  test('E2E 42 : le client voit sa réservation terminée, sans détails internes', async () => {
    const { emp, appt, mission } = await setupPlanned();
    await api().post(`/api/missions/${mission.id}/start`).set(auth(emp.token));
    await api().post(`/api/missions/${mission.id}/complete`).set(auth(emp.token)).send({});

    const request = await prisma.serviceRequest.findUnique({ where: { id: appt.requestId } });
    const client = await prisma.user.findUnique({ where: { id: request.clientId } });
    const login = await api().post('/api/auth/login').send({ email: client.email, password: 'Test1234' });
    const token = login.body.accessToken;

    const res = await api().get(`/api/appointments/${appt.id}`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.mission).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('internalInstructions');

    const missions = await api().get('/api/missions').set(auth(token));
    expect(missions.status).toBe(403);
    const photos = await api().get(`/api/missions/${mission.id}/photos`).set(auth(token));
    expect(photos.status).toBe(403);
  });

  test('ordre imposé : pas de terminer avant démarrer, pas de démarrer deux fois', async () => {
    const { emp, mission } = await setupPlanned();

    const tooEarly = await api().post(`/api/missions/${mission.id}/complete`).set(auth(emp.token)).send({});
    expect(tooEarly.status).toBe(409);

    await api().post(`/api/missions/${mission.id}/start`).set(auth(emp.token));
    const twice = await api().post(`/api/missions/${mission.id}/start`).set(auth(emp.token));
    expect(twice.status).toBe(409);
  });

  test('un employé non assigné ne peut ni démarrer ni cocher (404)', async () => {
    const { mission, items } = await setupPlanned();
    const other = await createUserWithToken({ role: 'EMPLOYEE' });

    const start = await api().post(`/api/missions/${mission.id}/start`).set(auth(other.token));
    expect(start.status).toBe(404);
    const check = await api()
      .patch(`/api/missions/${mission.id}/checklist/${items[0].id}`)
      .set(auth(other.token))
      .send({ isDone: true });
    expect(check.status).toBe(404);
  });

  test('la checklist ne se coche pas avant le démarrage', async () => {
    const { emp, mission, items } = await setupPlanned();
    const res = await api()
      .patch(`/api/missions/${mission.id}/checklist/${items[0].id}`)
      .set(auth(emp.token))
      .send({ isDone: true });
    expect(res.status).toBe(409);
  });

  test('l’admin ne démarre pas une mission à la place de l’employé (403)', async () => {
    const { admin, mission } = await setupPlanned();
    const res = await api().post(`/api/missions/${mission.id}/start`).set(auth(admin.token));
    expect(res.status).toBe(403);
  });

  test('l’employé assigné reçoit une notification', async () => {
    const { emp } = await setupPlanned();
    const res = await api().get('/api/notifications').set(auth(emp.token));
    expect(res.body.items.map((n) => n.type)).toContain('MISSION_ASSIGNED');
  });
});
