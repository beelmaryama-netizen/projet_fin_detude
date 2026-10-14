import { api, resetDb, createUserWithToken, createRequest, prisma } from './helpers.js';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('Photos de demande', () => {
  test('E2E 36 : le client obtient une signature puis enregistre la photo de sa demande', async () => {
    const client = await createUserWithToken({ role: 'CLIENT' });
    const request = await createRequest(client.user.id, 'NEW');

    const sig = await api()
      .post('/api/uploads/signature')
      .set(auth(client.token))
      .send({ target: 'REQUEST', id: request.id });
    expect(sig.status).toBe(200);
    expect(sig.body.folder).toBe(`magicpro/requests/${request.id}`);
    expect(sig.body.signature).toBeDefined();
    expect(sig.body.type).toBe('authenticated');

    const photo = await api()
      .post(`/api/requests/${request.id}/photos`)
      .set(auth(client.token))
      .send({ fileKey: `${sig.body.folder}/cuisine`, caption: 'Cuisine' });
    expect(photo.status).toBe(201);
    expect(photo.body.url).toBeDefined();

    const detail = await api().get(`/api/requests/${request.id}`).set(auth(client.token));
    expect(detail.body.photos).toHaveLength(1);
    expect(detail.body.photos[0].url).toBeDefined();
  });

  test('une clé d’un autre dossier est refusée (400)', async () => {
    const client = await createUserWithToken({ role: 'CLIENT' });
    const request = await createRequest(client.user.id, 'NEW');
    const res = await api()
      .post(`/api/requests/${request.id}/photos`)
      .set(auth(client.token))
      .send({ fileKey: 'magicpro/requests/autre-demande/photo' });
    expect(res.status).toBe(400);
  });

  test('un autre client ne peut ni signer ni ajouter (404)', async () => {
    const owner = await createUserWithToken({ role: 'CLIENT' });
    const other = await createUserWithToken({ role: 'CLIENT' });
    const request = await createRequest(owner.user.id, 'NEW');

    const sig = await api()
      .post('/api/uploads/signature')
      .set(auth(other.token))
      .send({ target: 'REQUEST', id: request.id });
    expect(sig.status).toBe(404);

    const add = await api()
      .post(`/api/requests/${request.id}/photos`)
      .set(auth(other.token))
      .send({ fileKey: `magicpro/requests/${request.id}/x` });
    expect(add.status).toBe(404);
  });

  test('un client ne peut pas signer pour une mission (403)', async () => {
    const client = await createUserWithToken({ role: 'CLIENT' });
    const res = await api()
      .post('/api/uploads/signature')
      .set(auth(client.token))
      .send({ target: 'MISSION', id: '00000000-0000-4000-8000-000000000000' });
    expect(res.status).toBe(403);
  });
});
