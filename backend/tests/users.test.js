import { api, resetDb, createUserWithToken, createUser, prisma } from './helpers.js';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('Gestion des utilisateurs', () => {
  test('un CLIENT ne peut pas lister les utilisateurs (403)', async () => {
    const { token } = await createUserWithToken({ role: 'CLIENT' });
    const res = await api().get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('ADMIN crée un employé avec mot de passe temporaire', async () => {
    const { token } = await createUserWithToken({ role: 'ADMIN' });
    const res = await api()
      .post('/api/users/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'emp@test.ca', firstName: 'Emp', lastName: 'Loyé' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('EMPLOYEE');
    expect(res.body.user.mustChangePassword).toBe(true);
    expect(res.body.tempPassword).toBeDefined();
  });

  test('employé avec mot de passe temporaire bloqué tant qu’il ne l’a pas changé', async () => {
    const { token } = await createUserWithToken({ role: 'EMPLOYEE', mustChangePassword: true });
    const res = await api()
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '514-000-0000' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('MUST_CHANGE_PASSWORD');
  });

  test('ADMIN ne peut pas suspendre un autre ADMIN', async () => {
    const { token } = await createUserWithToken({ role: 'ADMIN' });
    const other = await createUser({ role: 'ADMIN' });
    const res = await api()
      .patch(`/api/users/${other.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'SUSPENDED' });

    expect(res.status).toBe(403);
  });
});
