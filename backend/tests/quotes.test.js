import { api, resetDb, createUserWithToken, createRequest, prisma } from './helpers.js';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const quoteBody = {
  items: [
    { description: 'Ménage complet 3 chambres', qty: 1, unitPrice: 180 },
    { description: 'Nettoyage four', qty: 1, unitPrice: 35.5 },
  ],
  estimatedMinutes: 240,
  employeesNeeded: 2,
};

async function setup() {
  const client = await createUserWithToken({ role: 'CLIENT' });
  const admin = await createUserWithToken({ role: 'ADMIN' });
  const request = await createRequest(client.user.id, 'UNDER_REVIEW');
  return { client, admin, request };
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

async function createAndSend(admin, requestId) {
  const created = await api().post(`/api/requests/${requestId}/quotes`).set(auth(admin.token)).send(quoteBody);
  await api().post(`/api/quotes/${created.body.id}/send`).set(auth(admin.token)).send({});
  return created.body;
}

describe('Offres', () => {
  test('ADMIN crée une offre : totaux calculés côté serveur (TPS + TVQ)', async () => {
    const { admin, request } = await setup();
    const res = await api().post(`/api/requests/${request.id}/quotes`).set(auth(admin.token)).send(quoteBody);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('DRAFT');
    expect(res.body.version).toBe(1);
    // 215.50 + TPS 10.78 + TVQ 21.50 = 247.78 (Prisma renvoie les Decimal en string)
    expect(Number(res.body.subtotal)).toBe(215.5);
    expect(Number(res.body.taxes)).toBe(32.28);
    expect(Number(res.body.total)).toBe(247.78);
    expect(res.body.items).toHaveLength(2);
  });

  test('le CLIENT ne voit pas les brouillons', async () => {
    const { client, admin, request } = await setup();
    const created = await api().post(`/api/requests/${request.id}/quotes`).set(auth(admin.token)).send(quoteBody);

    const list = await api().get(`/api/requests/${request.id}/quotes`).set(auth(client.token));
    expect(list.body).toHaveLength(0);

    const one = await api().get(`/api/quotes/${created.body.id}`).set(auth(client.token));
    expect(one.status).toBe(404);
  });

  test('envoi : offre SENT et demande AWAITING_CLIENT', async () => {
    const { admin, request } = await setup();
    const quote = await createAndSend(admin, request.id);

    const q = await prisma.quote.findUnique({ where: { id: quote.id } });
    const r = await prisma.serviceRequest.findUnique({ where: { id: request.id } });
    expect(q.status).toBe('SENT');
    expect(q.expiresAt).not.toBeNull();
    expect(r.status).toBe('AWAITING_CLIENT');
  });

  test('acceptation : ACCEPTED, demande SCHEDULING, champs internes cachés', async () => {
    const { client, admin, request } = await setup();
    const quote = await createAndSend(admin, request.id);

    const res = await api().post(`/api/quotes/${quote.id}/accept`).set(auth(client.token)).send({});
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ACCEPTED');
    expect(res.body.createdByAdminId).toBeUndefined();

    const r = await prisma.serviceRequest.findUnique({ where: { id: request.id } });
    expect(r.status).toBe('SCHEDULING');

    // Séquence 7.2 : rendez-vous à confirmer créé automatiquement
    const appt = await prisma.serviceAppointment.findFirst({ where: { requestId: request.id } });
    expect(appt.status).toBe('PENDING_CONFIRMATION');
    expect(appt.acceptedQuoteId).toBe(quote.id);

    const again = await api().post(`/api/quotes/${quote.id}/accept`).set(auth(client.token)).send({});
    expect(again.status).toBe(409);
  });

  test('refus puis nouvelle version : demande revient UNDER_REVIEW, version 2', async () => {
    const { client, admin, request } = await setup();
    const v1 = await createAndSend(admin, request.id);

    const rej = await api()
      .post(`/api/quotes/${v1.id}/reject`)
      .set(auth(client.token))
      .send({});
    expect(rej.body.status).toBe('REJECTED');

    const r = await prisma.serviceRequest.findUnique({ where: { id: request.id } });
    expect(r.status).toBe('UNDER_REVIEW');

    const v2 = await api().post(`/api/requests/${request.id}/quotes`).set(auth(admin.token)).send(quoteBody);
    expect(v2.body.version).toBe(2);
  });

  test('une offre expirée ne peut pas être acceptée', async () => {
    const { client, admin, request } = await setup();
    const quote = await createAndSend(admin, request.id);
    await prisma.quote.update({ where: { id: quote.id }, data: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await api().post(`/api/quotes/${quote.id}/accept`).set(auth(client.token)).send({});
    expect(res.status).toBe(409);
  });

  test('un autre client ne peut pas accepter l’offre (404)', async () => {
    const { admin, request } = await setup();
    const other = await createUserWithToken({ role: 'CLIENT' });
    const quote = await createAndSend(admin, request.id);

    const res = await api().post(`/api/quotes/${quote.id}/accept`).set(auth(other.token)).send({});
    expect(res.status).toBe(404);
  });

  test('le CLIENT ne peut pas créer d’offre (403)', async () => {
    const { client, request } = await setup();
    const res = await api().post(`/api/requests/${request.id}/quotes`).set(auth(client.token)).send(quoteBody);
    expect(res.status).toBe(403);
  });
});
