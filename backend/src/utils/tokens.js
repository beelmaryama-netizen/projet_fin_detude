import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export function signAccessToken(user) {
  // Jamais d'info sensible dans le JWT : il est signé, pas chiffré
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

// Refresh token opaque (aléatoire), seul son hash est stocké en BD
export function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshExpiryDate() {
  const days = Number(process.env.REFRESH_TOKEN_DAYS || 7);
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
