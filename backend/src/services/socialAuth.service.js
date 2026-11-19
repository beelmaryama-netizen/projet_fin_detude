import crypto from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { issueTokens } from './auth.service.js';
import { createChallenge } from './challenges.service.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';
const providers = {
  google: {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    keys: createRemoteJWKSet(
      new URL('https://www.googleapis.com/oauth2/v3/certs'),
    ),
    env: 'GOOGLE_CLIENT_IDS',
  },
  apple: {
    issuer: 'https://appleid.apple.com',
    keys: createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys')),
    env: 'APPLE_CLIENT_IDS',
  },
};
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
function settings(provider) {
  const config = providers[provider];
  const audience = process.env[config.env]
    ?.split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  if (!audience?.length)
    throw new AppError(503, 'Connexion ' + provider + ' non configurée');
  return { ...config, audience };
}
export async function socialChallenge(provider) {
  settings(provider);
  const nonce = crypto.randomBytes(32).toString('hex');
  const id = crypto.randomUUID();
  const row = await prisma.authChallenge.create({
    data: {
      id,
      email: '',
      purpose: 'social:' + provider,
      codeHash: hash(nonce),
      expiresAt: new Date(Date.now() + 600000),
      resendAt: new Date(),
    },
  });
  // Pass this nonce unchanged in the provider's authorization request.
  return { challengeId: id, nonce, expiresAt: +row.expiresAt };
}
export async function verifyIdentityToken(token, config, nonceHash) {
  const { payload } = await jwtVerify(token, config.keys, {
    issuer: config.issuer,
    audience: config.audience,
    algorithms: ['RS256'],
    maxTokenAge: '10m',
    requiredClaims: ['sub', 'exp', 'iat', 'nonce'],
  });
  if (
    typeof payload.nonce !== 'string' ||
    hash(payload.nonce) !== nonceHash ||
    typeof payload.sub !== 'string'
  )
    throw new AppError(401, 'Identité fournisseur invalide');
  return payload;
}
export async function socialLogin(
  provider,
  { challengeId, idToken, firstName, lastName },
  verifyToken = verifyIdentityToken,
) {
  const config = settings(provider);
  const challenge = await prisma.authChallenge.findUnique({
    where: { id: challengeId },
  });
  if (
    !challenge ||
    challenge.purpose !== 'social:' + provider ||
    challenge.consumedAt ||
    challenge.expiresAt < new Date()
  )
    throw new AppError(401, 'Connexion expirée');
  let identity;
  try {
    identity = await verifyToken(idToken, config, challenge.codeHash);
  } catch {
    throw new AppError(401, 'Identité fournisseur invalide');
  }
  const authProvider = provider.toUpperCase();
  const user = await prisma.$transaction(async (tx) => {
    const taken = await tx.authChallenge.updateMany({
      where: {
        id: challengeId,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { consumedAt: new Date() },
    });
    if (!taken.count) throw new AppError(401, 'Connexion déjà utilisée');
    const existing = await tx.user.findUnique({
      where: {
        authProvider_providerSubject: {
          authProvider,
          providerSubject: identity.sub,
        },
      },
    });
    if (existing) {
      if (existing.status !== 'ACTIVE')
        throw new AppError(403, 'Compte suspendu');
      return existing;
    }
    if (
      typeof identity.email !== 'string' ||
      ![true, 'true'].includes(identity.email_verified)
    )
      throw new AppError(400, 'Une adresse courriel vérifiée est nécessaire');
    const email = identity.email.trim().toLowerCase();
    if (await tx.user.findUnique({ where: { email } }))
      throw new AppError(
        409,
        'Un compte existe déjà. Utilisez son mode de connexion habituel.',
      );
    return tx.user.create({
      data: {
        email,
        authProvider,
        providerSubject: identity.sub,
        role: 'CLIENT',
        firstName: (firstName || identity.given_name || 'Client').slice(0, 100),
        lastName: (lastName || identity.family_name || '').slice(0, 100),
        emailVerifiedAt: new Date(),
      },
    });
  });
  if (user.mfaEnabled)
    return {
      kind: 'verification',
      challenge: await createChallenge(user, 'login'),
    };
  return {
    kind: 'authenticated',
    user: sanitizeUser(user),
    ...(await issueTokens(user)),
  };
}
