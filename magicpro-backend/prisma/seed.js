import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upsertUser({ email, password, role, firstName, lastName, phone, mustChangePassword = false }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, role, firstName, lastName, phone, mustChangePassword },
  });
}

async function main() {
  // ---------- ADMIN ----------
  const admin = await upsertUser({
    email: process.env.ADMIN_EMAIL || 'admin@magicpro.ca',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
    role: 'ADMIN',
    firstName: 'Admin',
    lastName: 'MagicPro',
  });

  // ---------- EMPLOYÉ (mot de passe temporaire) ----------
  const employee = await upsertUser({
    email: 'employe@magicpro.ca',
    password: 'Employe123!',
    role: 'EMPLOYEE',
    firstName: 'Karim',
    lastName: 'Benali',
    phone: '514-555-0101',
    mustChangePassword: true,
  });

  // ---------- CLIENT ----------
  const client = await upsertUser({
    email: 'client@test.ca',
    password: 'Client123!',
    role: 'CLIENT',
    firstName: 'Sophie',
    lastName: 'Tremblay',
    phone: '514-555-0202',
  });

  // ---------- Données de test du client (une seule fois) ----------
  const existing = await prisma.serviceRequest.count({ where: { clientId: client.id } });

  if (existing === 0) {
    const address = await prisma.address.create({
      data: {
        userId: client.id,
        label: 'Maison',
        line1: '1234 rue Saint-Denis',
        city: 'Montréal',
        province: 'QC',
        postalCode: 'H2X 3K2',
        accessNotes: 'Code porte 4521',
      },
    });

    // Demande résidentielle
    await prisma.serviceRequest.create({
      data: {
        clientId: client.id,
        addressId: address.id,
        requestType: 'RESIDENTIAL',
        description: 'Grand ménage avant déménagement',
        residentialDetails: {
          create: {
            housingType: 'APARTMENT',
            bedrooms: 2,
            bathrooms: 1,
            floors: 1,
            areaSqft: 850,
            hasPets: true,
            specialNotes: 'Un chat, éviter les produits forts',
          },
        },
        availabilities: {
          create: [
            { startAt: new Date('2026-10-15T20:00:00Z'), endAt: new Date('2026-10-16T00:00:00Z'), priority: 1 },
            { startAt: new Date('2026-10-17T14:00:00Z'), endAt: new Date('2026-10-17T18:00:00Z'), priority: 2 },
          ],
        },
      },
    });

    // Demande entreprise
    await prisma.serviceRequest.create({
      data: {
        clientId: client.id,
        addressId: address.id,
        requestType: 'BUSINESS',
        description: 'Entretien de bureaux',
        status: 'UNDER_REVIEW',
        businessDetails: {
          create: {
            businessType: 'Bureau',
            companyName: 'Tremblay Conseil',
            areaSqft: 3000,
            areasToClean: ['Bureaux', 'Salle de réunion', 'Cuisine', 'Toilettes'],
            scopeDescription: 'Nettoyage complet des bureaux après les heures de travail',
            frequency: 'WEEKLY',
            constraints: 'Accès après 18 h seulement',
          },
        },
        availabilities: {
          create: [{ startAt: new Date('2026-10-20T22:00:00Z'), endAt: new Date('2026-10-21T02:00:00Z') }],
        },
      },
    });
  }

  console.log('Seed terminé :');
  console.log(`  ADMIN    ${admin.email}`);
  console.log(`  EMPLOYÉ  ${employee.email}  (Employe123!)`);
  console.log(`  CLIENT   ${client.email}  (Client123!)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());