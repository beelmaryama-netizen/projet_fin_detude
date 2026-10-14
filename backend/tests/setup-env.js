import dotenv from 'dotenv';

// Charge .env.test AVANT que Prisma soit importé : les tests utilisent magicpro_test, jamais la vraie base
dotenv.config({ path: '.env.test', override: true, quiet: true });

// Valeurs factices : la signature Cloudinary se calcule hors ligne, aucun appel réseau en test
process.env.CLOUDINARY_CLOUD_NAME ||= 'test-cloud';
process.env.CLOUDINARY_API_KEY ||= '123456789';
process.env.CLOUDINARY_API_SECRET ||= 'test-secret';
