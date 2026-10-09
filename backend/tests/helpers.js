import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

export const api = () => request(app);

// Vide toutes les tables (ordre enfants -> parents à cause des clés étrangères)
export async function resetDb() {
  await prisma.$transaction([
    prisma.serviceAppointment.deleteMany(),
    prisma.quoteItem.deleteMany(),
    prisma.quote.deleteMany(),
    prisma.requestPhoto.deleteMany(),
    prisma.requestAvailability.deleteMany(),
    prisma.residentialDetails.deleteMany(),
    prisma.businessDetails.deleteMany(),
    prisma.serviceRequest.deleteMany(),
    prisma.address.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

let counter = 0;

// Crée un utilisateur directement en BD
export async function createUser({ role = 'CLIENT', password = 'Test1234', ...data } = {}) {
  counter += 1;
  const user = await prisma.user.create({
    data: {
      email: `${role.toLowerCase()}${counter}_${Date.now()}@test.ca`,
      firstName: 'Test',
      lastName: role,
      role,
      passwordHash: await bcrypt.hash(password, 4), // coût faible = tests rapides
      ...data,
    },
  });
  return { ...user, password };
}

// Crée un utilisateur et renvoie son accessToken
export async function createUserWithToken(options = {}) {
  const user = await createUser(options);
  const res = await api().post('/api/auth/login').send({ email: user.email, password: user.password });
  return { user, token: res.body.accessToken, refreshToken: res.body.refreshToken };
}

export function createAddress(userId) {
  return prisma.address.create({
    data: {
      userId,
      label: 'Maison',
      line1: '1234 rue Test',
      city: 'Montréal',
      province: 'QC',
      postalCode: 'H2X 3K2',
    },
  });
}

// Crée une demande résidentielle directement en BD
export async function createRequest(clientId, status = 'NEW') {
  const address = await createAddress(clientId);
  return prisma.serviceRequest.create({
    data: {
      clientId,
      addressId: address.id,
      requestType: 'RESIDENTIAL',
      status,
      residentialDetails: { create: { housingType: 'HOUSE', bedrooms: 3, bathrooms: 2 } },
    },
  });
}

// Date future (en jours) pour les disponibilités
export function inDays(days, hours = 0) {
  return new Date(Date.now() + days * 86400000 + hours * 3600000).toISOString();
}

export { prisma };
