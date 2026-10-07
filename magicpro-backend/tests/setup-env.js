import dotenv from 'dotenv';

// Charge .env.test AVANT que Prisma soit importé : les tests utilisent magicpro_test, jamais la vraie base
dotenv.config({ path: '.env.test', override: true, quiet: true });
