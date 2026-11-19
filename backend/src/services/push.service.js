// Envoi push via Firebase Cloud Messaging.
// Activé seulement si FIREBASE_SERVICE_ACCOUNT_PATH est défini (jamais en test).
import fs from 'fs';
import { sendExpoPush, isExpoToken } from './expoPush.service.js';

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
  if (process.env.NODE_ENV === 'test' || !tokens.length) return [];
  const invalid = [];
  const expoTokens = tokens.filter(isExpoToken);
  if (expoTokens.length && process.env.EXPO_PUSH_ENABLED === 'true')
    invalid.push(...(await sendExpoPush(expoTokens, { title, body, data })));
  const direct = tokens.filter((token) => !isExpoToken(token));
  const fcm = await getMessaging();
  if (fcm)
    for (let i = 0; i < direct.length; i += 500) {
      const batch = direct.slice(i, i + 500);
      const res = await fcm.sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
        data,
      });
      res.responses.forEach((r, index) => {
        if (
          !r.success &&
          [
            'messaging/registration-token-not-registered',
            'messaging/invalid-registration-token',
          ].includes(r.error?.code)
        )
          invalid.push(batch[index]);
      });
    }
  return invalid;
}
