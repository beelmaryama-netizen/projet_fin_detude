import 'dotenv/config';
import { runReminders } from '../src/services/reminders.service.js';
import { prisma } from '../src/config/prisma.js';
try {
  console.log('Réservations examinées :', await runReminders());
} finally {
  await prisma.$disconnect();
}
