import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Désactivé pendant les tests (sinon les tests de login seraient bloqués)
  skip: () => process.env.NODE_ENV === 'test',
  message: { message: 'Trop de tentatives, réessayez dans 15 minutes' },
});
