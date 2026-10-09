import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';
import { generateTempPassword } from '../utils/tempPassword.js';

export async function listUsers({ role, status, search }) {
  const users = await prisma.user.findMany({
    where: {
      role,
      status,
      ...(search && {
        OR: [
          { email: { contains: search } },
          { firstName: { contains: search } },
          { lastName: { contains: search } },
        ],
      }),
    },
    orderBy: { createdAt: 'desc' },
  });
  return users.map(sanitizeUser);
}

export async function getUser(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'Utilisateur introuvable');
  return sanitizeUser(user);
}

// Règle : seul un ADMIN crée un EMPLOYÉ, avec mot de passe temporaire
export async function createEmployee(data) {
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw new AppError(409, 'Email déjà utilisé');

  const tempPassword = generateTempPassword();

  const user = await prisma.user.create({
    data: {
      ...data,
      role: 'EMPLOYEE',
      passwordHash: await bcrypt.hash(tempPassword, 10),
      mustChangePassword: true,
    },
  });

  // Le mot de passe temporaire est renvoyé UNE seule fois à l'admin
  return { user: sanitizeUser(user), tempPassword };
}

// Suspendre / réactiver un employé ou un client (jamais un admin)
export async function updateStatus(id, status) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, 'Utilisateur introuvable');
  if (user.role === 'ADMIN') throw new AppError(403, 'Impossible de modifier un administrateur');

  const [updated] = await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { status } }),
    // Suspension : on coupe toutes ses sessions
    ...(status === 'SUSPENDED'
      ? [
          prisma.refreshToken.updateMany({
            where: { userId: id, revokedAt: null },
            data: { revokedAt: new Date() },
          }),
        ]
      : []),
  ]);

  return sanitizeUser(updated);
}

// Réinitialiser le mot de passe d'un employé (nouveau mot de passe temporaire)
export async function resetEmployeePassword(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== 'EMPLOYEE') throw new AppError(404, 'Employé introuvable');

  const tempPassword = generateTempPassword();

  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(tempPassword, 10), mustChangePassword: true },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { tempPassword };
}

export async function updateMe(userId, data) {
  const user = await prisma.user.update({ where: { id: userId }, data });
  return sanitizeUser(user);
}
