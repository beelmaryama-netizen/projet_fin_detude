import crypto from 'node:crypto';
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from 'jose';
import { verifyIdentityToken } from '../src/services/socialAuth.service.js';
test('social identity verifies signature, issuer, audience, expiry and server nonce', async () => {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const jwk = await exportJWK(publicKey);
  jwk.kid = 'test';
  const config = {
    keys: createLocalJWKSet({ keys: [jwk] }),
    issuer: 'https://accounts.google.com',
    audience: ['magicpro-client'],
  };
  const nonce = 'random-server-nonce';
  const hash = crypto.createHash('sha256').update(nonce).digest('hex');
  const token = (overrides) =>
    new SignJWT({
      sub: 'provider-user',
      nonce,
      email: 'social@test.ca',
      email_verified: true,
      ...overrides,
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test' })
      .setIssuer(config.issuer)
      .setAudience('magicpro-client')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
  expect((await verifyIdentityToken(await token({}), config, hash)).sub).toBe(
    'provider-user',
  );
  await expect(
    verifyIdentityToken(await token({ nonce: 'wrong' }), config, hash),
  ).rejects.toThrow();
  await expect(
    verifyIdentityToken(
      await token({}),
      { ...config, audience: ['wrong'] },
      hash,
    ),
  ).rejects.toThrow();
  await expect(
    verifyIdentityToken(
      await token({}),
      { ...config, issuer: 'https://appleid.apple.com' },
      hash,
    ),
  ).rejects.toThrow();
  const expired = await new SignJWT({ sub: 'provider-user', nonce })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setIssuer(config.issuer)
    .setAudience('magicpro-client')
    .setIssuedAt(Math.floor(Date.now() / 1000) - 100)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 1)
    .sign(privateKey);
  await expect(verifyIdentityToken(expired, config, hash)).rejects.toThrow();
  const altered = (await token({})).split('.');
  altered[1] = Buffer.from(JSON.stringify({ sub: 'attacker', nonce })).toString(
    'base64url',
  );
  await expect(
    verifyIdentityToken(altered.join('.'), config, hash),
  ).rejects.toThrow();
});
