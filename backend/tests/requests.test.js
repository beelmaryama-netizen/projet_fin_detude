import { api, resetDb, createUserWithToken, createAddress, inDays, prisma } from './helpers.js';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

function residentialBody(addressId) {
  return {
    requestType: 'RESIDENTIAL',
    addressId,
    description: 'Ménage test',
    residential: { housingType: 'APARTMENT', bedrooms: 2, bathrooms: 1 },
    availabilities: [{ startAt: inDays(3), endAt: inDays(3, 4) }],
  };
}

describe('Demandes de service', () => {
  test('CLIENT crée une demande résidentielle (statut NEW)', async () => {
    const { user, token } = await createUserWithToken({ role: 'CLIENT' });
    const address = await createAddress(user.id);

    const res = await api()
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send(residentialBody(address.id));

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('NEW');
    expect(res.body.residentialDetails.bedrooms).toBe(2);
    expect(res.body.availabilities).toHaveLength(1);
  });

  test('RESIDENTIAL sans bloc residential -> 400', async () => {
    const { user, token } = await createUserWithToken({ role: 'CLIENT' });
    const address = await createAddress(user.id);
    const body = residentialBody(address.id);
    delete body.residential;

    const res = await api().post('/api/requests').set('Authorization', `Bearer ${token}`).send(body);
    expect(res.status).toBe(400);
  });

  test('un client ne voit pas la demande d’un autre client (404)', async () => {
    const c1 = await createUserWithToken({ role: 'CLIENT' });
    const c2 = await createUserWithToken({ role: 'CLIENT' });
    const address = await createAddress(c1.user.id);

    const created = await api()
      .post('/api/requests')
      .set('Authorization', `Bearer ${c1.token}`)
      .send(residentialBody(address.id));

    const res = await api()
      .get(`/api/requests/${created.body.id}`)
      .set('Authorization', `Bearer ${c2.token}`);
    expect(res.status).toBe(404);
  });

  test('un client ne peut pas utiliser l’adresse d’un autre (404)', async () => {
    const c1 = await createUserWithToken({ role: 'CLIENT' });
    const c2 = await createUserWithToken({ role: 'CLIENT' });
    const address = await createAddress(c1.user.id);

    const res = await api()
      .post('/api/requests')
      .set('Authorization', `Bearer ${c2.token}`)
      .send(residentialBody(address.id));
    expect(res.status).toBe(404);
  });

  test('un EMPLOYÉ n’a pas accès aux demandes (403)', async () => {
    const { token } = await createUserWithToken({ role: 'EMPLOYEE' });
    const res = await api().get('/api/requests').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('ADMIN : NEW -> UNDER_REVIEW autorisé, NEW -> COMPLETED interdit', async () => {
    const client = await createUserWithToken({ role: 'CLIENT' });
    const admin = await createUserWithToken({ role: 'ADMIN' });
    const address = await createAddress(client.user.id);

    const created = await api()
      .post('/api/requests')
      .set('Authorization', `Bearer ${client.token}`)
      .send(residentialBody(address.id));

    const bad = await api()
      .patch(`/api/requests/${created.body.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'COMPLETED' });
    expect(bad.status).toBe(409);

    const ok = await api()
      .patch(`/api/requests/${created.body.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'UNDER_REVIEW' });
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe('UNDER_REVIEW');
  });
});
