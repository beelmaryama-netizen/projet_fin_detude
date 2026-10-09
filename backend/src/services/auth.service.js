import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  refreshExpiryDate,
} from '../utils/tokens.js';

async function issueTokens(user) {
  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiryDate(),
    },
  });
  return { accessToken: signAccessToken(user), refreshToken };
}

export async function register({ email, password, firstName, lastName, phone }) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new AppError(409, 'Email déjà utilisé');

  const user = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      phone,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'CLIENT', // Règle métier : inscription publique = toujours CLIENT
    },
  });

  return { user: sanitizeUser(user), ...(await issueTokens(user)) };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Même message pour email ou mot de passe faux (ne pas révéler si l'email existe)
  const ok = user?.passwordHash && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw new AppError(401, 'Email ou mot de passe incorrect');
  if (user.status !== 'ACTIVE') throw new AppError(403, 'Compte suspendu');

  return { user: sanitizeUser(user), ...(await issueTokens(user)) };
}

export async function refresh(refreshToken) {
  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash: hashToken(refreshToken) },
    include: { user: true },
  });
  if (!stored) throw new AppError(401, 'Refresh token invalide');

  // Token déjà utilisé : possible vol, on révoque toutes les sessions
  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AppError(401, 'Session révoquée, reconnectez-vous');
  }

  if (stored.expiresAt < new Date()) throw new AppError(401, 'Refresh token expiré');
  if (stored.user.status !== 'ACTIVE') throw new AppError(403, 'Compte suspendu');

  // Rotation : l'ancien token est révoqué, un nouveau est émis
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return issueTokens(stored.user);
}

export async function logout(refreshToken) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'Utilisateur introuvable');
  return sanitizeUser(user);
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const ok = user?.passwordHash && (await bcrypt.compare(currentPassword, user.passwordHash));
  if (!ok) throw new AppError(400, 'Mot de passe actuel incorrect');

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    }),
    // Déconnecte toutes les sessions
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}
