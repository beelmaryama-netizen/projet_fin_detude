import dotenv from 'dotenv';

// Charge .env.test AVANT que Prisma soit importé : les tests utilisent magicpro_test, jamais la vraie base
dotenv.config({ path: '.env.test', override: true, quiet: true });

const testUrl = new URL(process.env.DATABASE_URL || 'mysql://localhost/missing');
if (!testUrl.pathname.endsWith('_test')) throw new Error('Refus des tests : DATABASE_URL doit cibler une base dédiée terminant par _test.');
// Valeurs factices : la signature Cloudinary se calcule hors ligne, aucun appel réseau en test
process.env.FILE_STORAGE = 'cloudinary';
process.env.CLOUDINARY_CLOUD_NAME ||= 'test-cloud';
process.env.CLOUDINARY_API_KEY ||= '123456789';
process.env.CLOUDINARY_API_SECRET ||= 'test-secret';
