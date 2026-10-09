import { api, resetDb, createUser, prisma } from './helpers.js';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('POST /api/auth/register', () => {
  test('crée toujours un CLIENT même si role=ADMIN est envoyé', async () => {
    const res = await api().post('/api/auth/register').send({
      email: 'hacker@test.ca',
      password: 'Test1234',
      firstName: 'Ha',
      lastName: 'Cker',
      role: 'ADMIN',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('CLIENT');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.accessToken).toBeDefined();
  });

  test('refuse un email déjà utilisé (409)', async () => {
    const user = await createUser();
    const res = await api().post('/api/auth/register').send({
      email: user.email,
      password: 'Test1234',
      firstName: 'A',
      lastName: 'B',
    });
    expect(res.status).toBe(409);
  });

  test('refuse un mot de passe faible (400)', async () => {
    const res = await api().post('/api/auth/register').send({
      email: 'faible@test.ca',
      password: '123',
      firstName: 'A',
      lastName: 'B',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  test('connexion OK', async () => {
    const user = await createUser();
    const res = await api().post('/api/auth/login').send({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    expect(res.body.refreshToken).toBeDefined();
  });

  test('mauvais mot de passe -> 401', async () => {
    const user = await createUser();
    const res = await api().post('/api/auth/login').send({ email: user.email, password: 'Faux1234' });
    expect(res.status).toBe(401);
  });

  test('compte suspendu -> 403', async () => {
    const user = await createUser({ status: 'SUSPENDED' });
    const res = await api().post('/api/auth/login').send({ email: user.email, password: user.password });
    expect(res.status).toBe(403);
  });
});

describe('Tokens', () => {
  test('/me sans token -> 401', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('refresh : rotation, et réutilisation de l’ancien token refusée', async () => {
    const user = await createUser();
    const login = await api().post('/api/auth/login').send({ email: user.email, password: user.password });
    const oldRefresh = login.body.refreshToken;

    const first = await api().post('/api/auth/refresh').send({ refreshToken: oldRefresh });
    expect(first.status).toBe(200);
    expect(first.body.refreshToken).not.toBe(oldRefresh);

    const reuse = await api().post('/api/auth/refresh').send({ refreshToken: oldRefresh });
    expect(reuse.status).toBe(401);
  });
});
