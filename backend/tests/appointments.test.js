import { api, resetDb, createUserWithToken, createRequest, inDays, prisma } from './helpers.js';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const quoteBody = {
  items: [{ description: 'Ménage complet', qty: 1, unitPrice: 200 }],
  estimatedMinutes: 180,
  employeesNeeded: 2,
};

// Parcours complet jusqu'à "offre acceptée" -> rendez-vous PENDING_CONFIRMATION
async function setupAccepted() {
  const client = await createUserWithToken({ role: 'CLIENT' });
  const admin = await createUserWithToken({ role: 'ADMIN' });
  const request = await createRequest(client.user.id, 'UNDER_REVIEW');

  const quote = await api().post(`/api/requests/${request.id}/quotes`).set(auth(admin.token)).send(quoteBody);
  await api().post(`/api/quotes/${quote.body.id}/send`).set(auth(admin.token)).send({});
  await api().post(`/api/quotes/${quote.body.id}/accept`).set(auth(client.token)).send({});

  const appointment = await prisma.serviceAppointment.findFirst({ where: { requestId: request.id } });
  return { client, admin, request, appointment };
}

const schedule = () => ({ scheduledStart: inDays(5), scheduledEnd: inDays(5, 3) });

describe('Réservations', () => {
  test('le CLIENT voit sa réservation, sans champ interne', async () => {
    const { client, appointment } = await setupAccepted();
    const res = await api().get('/api/appointments').set(auth(client.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(appointment.id);
    expect(res.body[0].status).toBe('PENDING_CONFIRMATION');
    expect(res.body[0].confirmedByAdminId).toBeUndefined();
  });

  test('un autre client ne voit pas la réservation (404)', async () => {
    const { appointment } = await setupAccepted();
    const other = await createUserWithToken({ role: 'CLIENT' });
    const res = await api().get(`/api/appointments/${appointment.id}`).set(auth(other.token));
    expect(res.status).toBe(404);
  });

  test('un EMPLOYÉ n’a pas accès aux réservations (403)', async () => {
    const employee = await createUserWithToken({ role: 'EMPLOYEE' });
    const res = await api().get('/api/appointments').set(auth(employee.token));
    expect(res.status).toBe(403);
  });

  test('ADMIN confirme : CONFIRMED + dates + demande ACTIVE', async () => {
    const { admin, request, appointment } = await setupAccepted();
    const res = await api()
      .post(`/api/appointments/${appointment.id}/confirm`)
      .set(auth(admin.token))
      .send(schedule());

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CONFIRMED');
    expect(res.body.scheduledStart).toBeDefined();
    expect(res.body.confirmedByAdminId).toBe(admin.user.id);

    const r = await prisma.serviceRequest.findUnique({ where: { id: request.id } });
    expect(r.status).toBe('ACTIVE');

    const again = await api()
      .post(`/api/appointments/${appointment.id}/confirm`)
      .set(auth(admin.token))
      .send(schedule());
    expect(again.status).toBe(409);
  });

  test('confirmation sans dates ou fin avant début -> 400', async () => {
    const { admin, appointment } = await setupAccepted();
    const res = await api()
      .post(`/api/appointments/${appointment.id}/confirm`)
      .set(auth(admin.token))
      .send({ scheduledStart: inDays(5, 3), scheduledEnd: inDays(5) });
    expect(res.status).toBe(400);
  });

  test('le CLIENT ne peut pas confirmer (403)', async () => {
    const { client, appointment } = await setupAccepted();
    const res = await api()
      .post(`/api/appointments/${appointment.id}/confirm`)
      .set(auth(client.token))
      .send(schedule());
    expect(res.status).toBe(403);
  });

  test('replanifier : seulement une réservation CONFIRMED', async () => {
    const { admin, appointment } = await setupAccepted();

    const tooEarly = await api()
      .post(`/api/appointments/${appointment.id}/reschedule`)
      .set(auth(admin.token))
      .send(schedule());
    expect(tooEarly.status).toBe(409);

    await api().post(`/api/appointments/${appointment.id}/confirm`).set(auth(admin.token)).send(schedule());

    const res = await api()
      .post(`/api/appointments/${appointment.id}/reschedule`)
      .set(auth(admin.token))
      .send({ scheduledStart: inDays(8), scheduledEnd: inDays(8, 2) });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CONFIRMED');
  });

  test('le CLIENT ajoute des notes à sa réservation', async () => {
    const { client, appointment } = await setupAccepted();
    const res = await api()
      .patch(`/api/appointments/${appointment.id}/client-notes`)
      .set(auth(client.token))
      .send({ clientNotes: 'Sonner au 2e étage' });
    expect(res.status).toBe(200);
    expect(res.body.clientNotes).toBe('Sonner au 2e étage');
  });

  test('ADMIN annule : réservation et demande CANCELLED', async () => {
    const { admin, request, appointment } = await setupAccepted();
    const res = await api().post(`/api/appointments/${appointment.id}/cancel`).set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');

    const r = await prisma.serviceRequest.findUnique({ where: { id: request.id } });
    expect(r.status).toBe('CANCELLED');
  });
});
