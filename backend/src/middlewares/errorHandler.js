import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

export function notFound(req, res) {
  res.status(404).json({ message: 'Route introuvable' });
}

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Données invalides',
      errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message, code: err.code });
  }

  // Erreurs Prisma connues
  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'Cette valeur existe déjà' });
  }
  if (err.code === 'P2003') {
    return res.status(409).json({ message: 'Élément utilisé ailleurs, suppression impossible' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Élément introuvable' });
  }

  console.error(err);
  res.status(500).json({ message: 'Erreur serveur' });
}
