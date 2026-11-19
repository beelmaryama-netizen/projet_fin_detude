import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { sendCode } from './mail.service.js';
import { issueTokens } from './auth.service.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';
const digest = (value) =>
  crypto
    .createHmac('sha256', process.env.JWT_ACCESS_SECRET)
    .update(value)
    .digest('hex');
const publicChallenge = (row) => ({
  id: row.id,
  email: row.email,
  purpose: row.purpose,
  expiresAt: +row.expiresAt,
  resendAt: +row.resendAt,
});
export async function createChallenge(user, purpose, payload = {}) {
  const email = user.email;
  const recent = await prisma.authChallenge.findFirst({
    where: {
      email,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
      resendAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (
    recent &&
    JSON.stringify(recent.payload?.enabled) === JSON.stringify(payload.enabled)
  )
    return publicChallenge(recent);
  const count = await prisma.authChallenge.count({
    where: {
      email,
      purpose,
      createdAt: { gt: new Date(Date.now() - 3600000) },
    },
  });
  if (count >= 10)
    throw new AppError(429, 'Trop de demandes. Réessayez plus tard.');
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const id = crypto.randomUUID();
  const row = await prisma.authChallenge.create({
    data: {
      id,
      email,
      userId: user.id ?? null,
      purpose,
      payload: { ...payload, version: user.tokenVersion ?? 0 },
      codeHash: digest(id + ':' + code),
      expiresAt: new Date(Date.now() + 600000),
      resendAt: new Date(Date.now() + 60000),
    },
  });
  try {
    if (user.id) await sendCode(email, code, id);
  } catch (error) {
    await prisma.authChallenge.delete({ where: { id } });
    throw error;
  }
  await prisma.authChallenge.updateMany({
    where: { email, purpose, id: { not: id }, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  return publicChallenge(row);
}
export async function resendChallenge(id) {
  const row = await prisma.authChallenge.findUnique({ where: { id } });
  if (
    !row ||
    row.consumedAt ||
    !['login', 'registration', 'recovery'].includes(row.purpose)
  )
    throw new AppError(400, 'Vérification invalide');
  if (row.resendAt > new Date())
    throw new AppError(429, 'Patientez avant de demander un nouveau code');
  const user = row.userId
    ? await prisma.user.findUnique({ where: { id: row.userId } })
    : null;
  return createChallenge(
    user?.status === 'ACTIVE' ? user : { email: row.email },
    row.purpose,
  );
}
export async function consumeCode(id, code, purposes, ownerId) {
  // Commit failed attempts as well as successful consumption. Conditional writes prevent replay.
  const outcome = await prisma.$transaction(async (tx) => {
    const row = await tx.authChallenge.findUnique({ where: { id } });
    if (
      !row ||
      !purposes.includes(row.purpose) ||
      (ownerId && row.userId !== ownerId)
    )
      return {};
    const attempt = await tx.authChallenge.updateMany({
      where: {
        id,
        consumedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { lt: 5 },
      },
      data: { attempts: { increment: 1 } },
    });
    if (
      !attempt.count ||
      !crypto.timingSafeEqual(
        Buffer.from(row.codeHash, 'hex'),
        Buffer.from(digest(id + ':' + code), 'hex'),
      )
    )
      return {};
    const user = row.userId
      ? await tx.user.findUnique({ where: { id: row.userId } })
      : null;
    if (
      !user ||
      user.status !== 'ACTIVE' ||
      (row.payload?.version ?? 0) !== user.tokenVersion
    )
      return {};
    const taken = await tx.authChallenge.updateMany({
      where: { id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    return taken.count ? { row, user } : {};
  });
  if (!outcome.row)
    throw new AppError(400, 'Code invalide, expiré ou déjà utilisé');
  return outcome;
}
export async function verifyChallenge(id, code) {
  const { row, user } = await consumeCode(id, code, [
    'registration',
    'login',
    'recovery',
  ]);
  if (row.purpose === 'recovery') {
    const secret = crypto.randomBytes(32).toString('hex');
    const reset = await prisma.authChallenge.create({
      data: {
        email: user.email,
        userId: user.id,
        purpose: 'reset',
        codeHash: digest(secret),
        payload: { version: user.tokenVersion },
        expiresAt: new Date(Date.now() + 600000),
        resendAt: new Date(),
      },
    });
    return { kind: 'recovery', resetToken: reset.id + '.' + secret };
  }
  const verified =
    row.purpose === 'registration'
      ? await prisma.user.update({
          where: { id: user.id },
          data: { emailVerifiedAt: new Date() },
        })
      : user;
  return {
    kind: 'authenticated',
    user: sanitizeUser(verified),
    ...(await issueTokens(verified)),
  };
}
export async function requestRecovery(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  return createChallenge(
    user?.status === 'ACTIVE' && user.passwordHash ? user : { email },
    'recovery',
  );
}
export async function resetPassword(resetToken, password) {
  const [id, secret] = resetToken.split('.');
  if (!id || !secret) throw new AppError(400, 'Lien de récupération invalide');
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction(async (tx) => {
    const row = await tx.authChallenge.findUnique({ where: { id } });
    if (!row || row.purpose !== 'reset' || row.codeHash !== digest(secret))
      throw new AppError(400, 'Lien de récupération invalide');
    const user = await tx.user.findUnique({ where: { id: row.userId } });
    if (
      !user ||
      user.status !== 'ACTIVE' ||
      user.tokenVersion !== row.payload.version
    )
      throw new AppError(400, 'Lien de récupération invalide');
    const claimed = await tx.authChallenge.updateMany({
      where: { id, consumedAt: null, expiresAt: { gt: new Date() } },
      data: { consumedAt: new Date() },
    });
    if (!claimed.count) throw new AppError(400, 'Lien expiré ou déjà utilisé');
    await tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        tokenVersion: { increment: 1 },
      },
    });
    await tx.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await tx.authChallenge.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
  });
}
export async function requestMfa(userId, enabled, currentPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (
    user.passwordHash &&
    !(await bcrypt.compare(currentPassword || '', user.passwordHash))
  )
    throw new AppError(400, 'Mot de passe actuel incorrect');
  return createChallenge(user, 'mfa-setting', { enabled });
}
export async function confirmMfa(userId, id, code) {
  const { row } = await consumeCode(id, code, ['mfa-setting'], userId);
  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: row.payload.enabled, emailVerifiedAt: new Date() },
  });
  return { mfaEnabled: row.payload.enabled };
}
