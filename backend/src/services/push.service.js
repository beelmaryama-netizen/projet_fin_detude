// Envoi push via Firebase Cloud Messaging.
// Activé seulement si FIREBASE_SERVICE_ACCOUNT_PATH est défini (jamais en test).
import fs from 'fs';

let messaging = null;
let initialized = false;

async function getMessaging() {
  if (initialized) return messaging;
  initialized = true;

  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!path || process.env.NODE_ENV === 'test') return null;

  try {
    // API modulaire (firebase-admin v12+)
    const { initializeApp, cert } = await import('firebase-admin/app');
    const { getMessaging: fcm } = await import('firebase-admin/messaging');
    const credentials = JSON.parse(fs.readFileSync(path, 'utf8'));
    initializeApp({ credential: cert(credentials) });
    messaging = fcm();
  } catch (err) {
    console.error('[push] Firebase non initialisé :', err.message);
  }
  return messaging;
}

// Renvoie la liste des tokens invalides à supprimer
export async function sendPush(tokens, { title, body, data }) {
  const fcm = await getMessaging();
  if (!fcm || tokens.length === 0) return [];

  const res = await fcm.sendEachForMulticast({ tokens, notification: { title, body }, data });
  return res.responses
    .map((r, i) => (!r.success && r.error?.code === 'messaging/registration-token-not-registered' ? tokens[i] : null))
    .filter(Boolean);
}