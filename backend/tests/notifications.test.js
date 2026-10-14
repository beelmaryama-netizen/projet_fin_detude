import { api, resetDb, createUserWithToken, createRequest, prisma } from './helpers.js';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const auth = (token) => ({ Authorization: `Bearer ${token}` });

async function sendQuote() {
  const client = await createUserWithToken({ role: 'CLIENT' });
  const admin = await createUserWithToken({ role: 'ADMIN' });
  const request = await createRequest(client.user.id, 'UNDER_REVIEW');
  const quote = await api()
    .post(`/api/requests/${request.id}/quotes`)
    .set(auth(admin.token))
    .send({ items: [{ description: 'Ménage', qty: 1, unitPrice: 100 }] });
  await api().post(`/api/quotes/${quote.body.id}/send`).set(auth(admin.token)).send({});
  return { client, admin, quoteId: quote.body.id };
}

describe('Notifications', () => {
  test('offre envoyée -> le client est notifié ; acceptée -> l’admin est notifié', async () => {
    const { client, admin, quoteId } = await sendQuote();

    const mine = await api().get('/api/notifications').set(auth(client.token));
    expect(mine.body.items[0].type).toBe('QUOTE_SENT');
    expect(mine.body.unread).toBe(1);

    await api().post(`/api/quotes/${quoteId}/accept`).set(auth(client.token));
    const adminNotifs = await api().get('/api/notifications').set(auth(admin.token));
    expect(adminNotifs.body.items.map((n) => n.type)).toContain('QUOTE_ACCEPTED');
  });

  test('marquer comme lue, puis tout lire', async () => {
    const { client } = await sendQuote();
    const list = await api().get('/api/notifications').set(auth(client.token));
    const id = list.body.items[0].id;

    const read = await api().post(`/api/notifications/${id}/read`).set(auth(client.token));
    expect(read.status).toBe(204);
    const after = await api().get('/api/notifications?unreadOnly=true').set(auth(client.token));
    expect(after.body.items).toHaveLength(0);

    const all = await api().post('/api/notifications/read-all').set(auth(client.token));
    expect(all.status).toBe(204);
  });

  test('on ne lit pas la notification d’un autre (404)', async () => {
    const { client } = await sendQuote();
    const other = await createUserWithToken({ role: 'CLIENT' });
    const id = (await api().get('/api/notifications').set(auth(client.token))).body.items[0].id;

    const res = await api().post(`/api/notifications/${id}/read`).set(auth(other.token));
    expect(res.status).toBe(404);
  });

  test('enregistrer et retirer un appareil (token FCM)', async () => {
    const user = await createUserWithToken({ role: 'CLIENT' });
    const token = 'fcm-token-de-test-1234567890';

    const reg = await api()
      .post('/api/notifications/devices')
      .set(auth(user.token))
      .send({ token, platform: 'ANDROID' });
    expect(reg.status).toBe(201);
    expect(await prisma.deviceToken.count({ where: { userId: user.user.id } })).toBe(1);

    const del = await api().delete('/api/notifications/devices').set(auth(user.token)).send({ token });
    expect(del.status).toBe(204);
    expect(await prisma.deviceToken.count({ where: { userId: user.user.id } })).toBe(0);
  });
});
