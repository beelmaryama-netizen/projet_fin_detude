import fs from 'node:fs/promises';
import { api, prisma, resetDb, createUserWithToken } from './helpers.js';
beforeEach(resetDb);
afterAll(() => prisma.$disconnect());
const auth = (token) => ({ Authorization: 'Bearer ' + token });
async function code(id) {
  const mail = JSON.parse(
    await fs.readFile('tmp/test-mail-outbox/' + id + '.json', 'utf8'),
  );
  return mail.text.match(/\b\d{6}\b/)[0];
}
test('registration verifies an expiring one-use code before issuing a session', async () => {
  process.env.REQUIRE_EMAIL_VERIFICATION = 'true';
  try {
    const input = {
      email: 'verified@test.ca',
      password: 'Test1234',
      firstName: 'Test',
      lastName: 'Client',
      role: 'ADMIN',
    };
    const result = await api()
      .post('/api/auth/register')
      .send(input)
      .expect(201);
    expect(result.body.accessToken).toBeUndefined();
    const c = result.body.challenge;
    const value = await code(c.id);
    const row = await prisma.authChallenge.findUnique({ where: { id: c.id } });
    expect(row.codeHash).not.toContain(value);
    const login = await api().post('/api/auth/login').send(input).expect(200);
    expect(login.body.kind).toBe('verification');
    await api()
      .post('/api/auth/resend-code')
      .send({ challengeId: c.id })
      .expect(429);
    const verified = await api()
      .post('/api/auth/verify-code')
      .send({ challengeId: c.id, code: value })
      .expect(200);
    expect(verified.body.user.role).toBe('CLIENT');
    expect(verified.body.user.emailVerifiedAt).toBeTruthy();
    await api()
      .post('/api/auth/verify-code')
      .send({ challengeId: c.id, code: value })
      .expect(400);
  } finally {
    process.env.REQUIRE_EMAIL_VERIFICATION = 'false';
  }
});
test('recovery is generic and resets password once, revoking access and refresh tokens', async () => {
  const user = await createUserWithToken();
  const known = await api()
    .post('/api/auth/forgot-password')
    .send({ email: user.user.email })
    .expect(200);
  const unknown = await api()
    .post('/api/auth/forgot-password')
    .send({ email: 'unknown@test.ca' })
    .expect(200);
  expect(Object.keys(unknown.body).sort()).toEqual(
    Object.keys(known.body).sort(),
  );
  await expect(
    fs.access('tmp/test-mail-outbox/' + unknown.body.id + '.json'),
  ).rejects.toThrow();
  const verified = await api()
    .post('/api/auth/verify-code')
    .send({ challengeId: known.body.id, code: await code(known.body.id) })
    .expect(200);
  expect(verified.body.kind).toBe('recovery');
  expect(verified.body.accessToken).toBeUndefined();
  await api()
    .post('/api/auth/reset-password')
    .send({
      resetToken: verified.body.resetToken,
      password: 'Reinitialise!2026',
    })
    .expect(204);
  await api().get('/api/auth/me').set(auth(user.token)).expect(401);
  await api()
    .post('/api/auth/refresh')
    .send({ refreshToken: user.refreshToken })
    .expect(401);
  await api()
    .post('/api/auth/reset-password')
    .send({ resetToken: verified.body.resetToken, password: 'Autre!2026' })
    .expect(400);
  await api()
    .post('/api/auth/login')
    .send({ email: user.user.email, password: 'Reinitialise!2026' })
    .expect(200);
});
test('wrong attempts lock the challenge, resend replaces old code, expired codes cannot be consumed', async () => {
  const user = await createUserWithToken();
  const result = await api()
    .post('/api/auth/forgot-password')
    .send({ email: user.user.email });
  const id = result.body.id;
  const value = await code(id);
  const wrong = value === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i++)
    await api()
      .post('/api/auth/verify-code')
      .send({ challengeId: id, code: wrong })
      .expect(400);
  await api()
    .post('/api/auth/verify-code')
    .send({ challengeId: id, code: value })
    .expect(400);
  await prisma.authChallenge.update({
    where: { id },
    data: { resendAt: new Date(0) },
  });
  const resent = await api()
    .post('/api/auth/resend-code')
    .send({ challengeId: id })
    .expect(200);
  expect(resent.body.id).not.toBe(id);
  await api()
    .post('/api/auth/verify-code')
    .send({ challengeId: id, code: value })
    .expect(400);
  await prisma.authChallenge.update({
    where: { id: resent.body.id },
    data: { expiresAt: new Date(0) },
  });
  await api()
    .post('/api/auth/verify-code')
    .send({ challengeId: resent.body.id, code: await code(resent.body.id) })
    .expect(400);
});
test('MFA enrollment requires password and ownership; login issues no token until verified', async () => {
  const user = await createUserWithToken();
  const other = await createUserWithToken();
  await api()
    .post('/api/auth/mfa/challenge')
    .set(auth(user.token))
    .send({ enabled: true, currentPassword: 'wrong' })
    .expect(400);
  const result = await api()
    .post('/api/auth/mfa/challenge')
    .set(auth(user.token))
    .send({ enabled: true, currentPassword: user.user.password })
    .expect(200);
  const proof = {
    challengeId: result.body.id,
    code: await code(result.body.id),
  };
  await api()
    .post('/api/auth/mfa/confirm')
    .set(auth(other.token))
    .send(proof)
    .expect(400);
  await api()
    .post('/api/auth/mfa/confirm')
    .set(auth(user.token))
    .send(proof)
    .expect(200);
  const login = await api()
    .post('/api/auth/login')
    .send({ email: user.user.email, password: user.user.password })
    .expect(200);
  expect(login.body.accessToken).toBeUndefined();
  expect(login.body.challenge.purpose).toBe('login');
  await api()
    .post('/api/auth/verify-code')
    .send({
      challengeId: login.body.challenge.id,
      code: await code(login.body.challenge.id),
    })
    .expect(200);
  expect(
    (await api().get('/api/auth/security').set(auth(user.token))).body
      .mfaEnabled,
  ).toBe(true);
});
