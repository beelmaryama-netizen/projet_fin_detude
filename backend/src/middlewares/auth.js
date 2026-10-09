import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/tokens.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) throw new AppError(401, 'Token manquant');

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new AppError(401, 'Token invalide ou expiré', 'TOKEN_INVALID');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true, mustChangePassword: true },
    });
    if (!user) throw new AppError(401, 'Utilisateur introuvable');
    if (user.status !== 'ACTIVE') throw new AppError(403, 'Compte suspendu');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// Usage : requireRole('ADMIN') ou requireRole('ADMIN', 'EMPLOYEE')
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError(403, 'Accès refusé'));
  }
  next();
};

// Bloque les routes tant que l'employé n'a pas changé son mot de passe temporaire
export function requirePasswordChanged(req, res, next) {
  if (req.user?.mustChangePassword) {
    return next(new AppError(403, 'Changement de mot de passe requis', 'MUST_CHANGE_PASSWORD'));
  }
  next();
}
