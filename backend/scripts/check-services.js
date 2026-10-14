// Vérifie que Cloudinary et Firebase sont bien configurés : node scripts/check-services.js
import 'dotenv/config';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

try {
  const res = await cloudinary.api.ping();
  console.log('✅ Cloudinary :', res.status);
} catch (err) {
  console.log('❌ Cloudinary :', err.error?.message || err.message);
}

try {
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!path) throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH manquant dans .env');
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getMessaging } = await import('firebase-admin/messaging');
  const credentials = JSON.parse(fs.readFileSync(path, 'utf8'));
  initializeApp({ credential: cert(credentials) });
  // Envoi "à blanc" (dryRun) vers un token bidon : valide la clé sans rien envoyer
  await getMessaging()
    .send({ token: 'token-de-test', notification: { title: 'test' } }, true)
    .catch((e) => {
      if (e.code === 'messaging/invalid-argument' || e.code === 'messaging/registration-token-not-registered') return;
      throw e;
    });
  console.log('✅ Firebase :', credentials.project_id);
} catch (err) {
  console.log('❌ Firebase :', err.message);
}

process.exit(0);