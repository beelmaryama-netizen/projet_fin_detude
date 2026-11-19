import { prisma, resetDb, createUserWithToken } from './helpers.js';
import {
  socialChallenge,
  socialLogin,
} from '../src/services/socialAuth.service.js';
beforeEach(resetDb);
afterAll(() => prisma.$disconnect());
test('social sign-in creates only clients and never links an existing email automatically', async () => {
  process.env.GOOGLE_CLIENT_IDS = 'test-audience';
  try {
    const challenge = await socialChallenge('google');
    const claims = {
      sub: 'google-test-subject',
      email: 'social@test.ca',
      email_verified: true,
      given_name: 'Social',
    };
    const result = await socialLogin(
      'google',
      { challengeId: challenge.challengeId, idToken: 'verified-by-unit-test' },
      async () => claims,
    );
    expect(result.user.role).toBe('CLIENT');
    expect(result.user.authProvider).toBe('GOOGLE');
    expect(result.accessToken).toBeTruthy();
    await expect(
      socialLogin(
        'google',
        { challengeId: challenge.challengeId, idToken: 'same' },
        async () => claims,
      ),
    ).rejects.toMatchObject({ status: 401 });
    const admin = await createUserWithToken({ role: 'ADMIN' });
    const collision = await socialChallenge('google');
    await expect(
      socialLogin(
        'google',
        { challengeId: collision.challengeId, idToken: 'verified' },
        async () => ({
          ...claims,
          sub: 'other-subject',
          email: admin.user.email,
        }),
      ),
    ).rejects.toMatchObject({ status: 409 });
    expect(await prisma.user.count()).toBe(2);
    await prisma.user.update({
      where: { id: result.user.id },
      data: { status: 'SUSPENDED' },
    });
    const suspended = await socialChallenge('google');
    await expect(
      socialLogin(
        'google',
        { challengeId: suspended.challengeId, idToken: 'verified' },
        async () => claims,
      ),
    ).rejects.toMatchObject({ status: 403 });
  } finally {
    delete process.env.GOOGLE_CLIENT_IDS;
  }
});
test('missing provider configuration fails explicitly', async () => {
  delete process.env.APPLE_CLIENT_IDS;
  await expect(socialChallenge('apple')).rejects.toMatchObject({ status: 503 });
});
