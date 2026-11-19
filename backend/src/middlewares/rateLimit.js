import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) =>
    ipKeyGenerator(req.ip) + ':' + req.baseUrl + ':' + req.path,
  standardHeaders: true,
  legacyHeaders: false,
  // Désactivé pendant les tests (sinon les tests de login seraient bloqués)
  skip: () => process.env.NODE_ENV === 'test',
  message: { message: 'Trop de tentatives, réessayez dans 15 minutes' },
});
