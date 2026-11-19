import {
  api,
  prisma,
  resetDb,
  createUserWithToken,
  createRequest,
} from './helpers.js';
beforeEach(resetDb);
afterAll(() => prisma.$disconnect());
const auth = (token) => ({ Authorization: 'Bearer ' + token });
const route = (url) => {
  const parsed = new URL(url);
  return parsed.pathname + parsed.search;
};
const pdf = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF');
test('PDF uploads enforce ownership, file type, quota, idempotency and deletion', async () => {
  const client = await createUserWithToken(),
    other = await createUserWithToken(),
    admin = await createUserWithToken({ role: 'ADMIN' });
  const request = await createRequest(client.user.id);
  await prisma.serviceRequest.update({
    where: { id: request.id },
    data: { requestType: 'BUSINESS' },
  });
  const base = '/api/requests/' + request.id + '/documents';
  await api()
    .post(base + '/signature')
    .set(auth(other.token))
    .send({ name: 'test.pdf', clientKey: 'first' })
    .expect(404);
  const signed = await api()
    .post(base + '/signature')
    .set(auth(client.token))
    .send({ name: 'test.pdf', clientKey: 'first' })
    .expect(200);
  await api()
    .post(route(signed.body.uploadUrl))
    .set('Content-Type', 'application/pdf')
    .send(Buffer.from('not pdf'))
    .expect(400);
  const uploaded = await api()
    .post(route(signed.body.uploadUrl))
    .set('Content-Type', 'application/pdf')
    .send(pdf)
    .expect(201);
  const repeated = await api()
    .post(route(signed.body.uploadUrl))
    .set('Content-Type', 'application/pdf')
    .send(pdf)
    .expect(201);
  expect(repeated.body.id).toBe(uploaded.body.id);
  await api().get(base).set(auth(other.token)).expect(404);
  const list = await api().get(base).set(auth(admin.token)).expect(200);
  expect(list.body).toHaveLength(1);
  await api()
    .get(route(list.body[0].uri))
    .expect(200)
    .expect('Content-Type', /application\/pdf/);
  for (let i = 1; i < 5; i++) {
    const s = await api()
      .post(base + '/signature')
      .set(auth(client.token))
      .send({ name: 'test.pdf', clientKey: String(i) });
    await api()
      .post(route(s.body.uploadUrl))
      .set('Content-Type', 'application/pdf')
      .send(pdf)
      .expect(201);
  }
  const sixth = await api()
    .post(base + '/signature')
    .set(auth(client.token))
    .send({ name: 'test.pdf', clientKey: 'sixth' });
  await api()
    .post(route(sixth.body.uploadUrl))
    .set('Content-Type', 'application/pdf')
    .send(pdf)
    .expect(409);
  await api()
    .delete(base + '/' + uploaded.body.id)
    .set(auth(client.token))
    .expect(204);
  await api().get(route(uploaded.body.uri)).expect(404);
});
test('catalogue is editable only by admin; archived services stay hidden from clients', async () => {
  const admin = await createUserWithToken({ role: 'ADMIN' }),
    client = await createUserWithToken();
  const body = {
    name: 'Clinique',
    category: 'MEDICAL',
    description: 'Entretien des salles de soins',
    active: true,
  };
  await api()
    .post('/api/services')
    .set(auth(client.token))
    .send(body)
    .expect(403);
  const created = await api()
    .post('/api/services')
    .set(auth(admin.token))
    .send(body)
    .expect(201);
  expect(
    (await api().get('/api/services').set(auth(client.token))).body,
  ).toHaveLength(1);
  await api()
    .patch('/api/services/' + created.body.id)
    .set(auth(admin.token))
    .send({ name: 'Entretien médical' })
    .expect(200);
  await api()
    .delete('/api/services/' + created.body.id)
    .set(auth(admin.token))
    .expect(204);
  expect(
    (await api().get('/api/services').set(auth(client.token))).body,
  ).toHaveLength(0);
  expect(
    (await api().get('/api/services').set(auth(admin.token))).body[0].active,
  ).toBe(false);
});
