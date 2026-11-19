import fs from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { AppError } from '../utils/AppError.js';
export async function sendCode(email, code, challengeId) {
  const message = {
    from: process.env.MAIL_FROM || 'MagicPro <no-reply@magicpro.local>',
    to: email,
    subject: 'Votre code MagicPro',
    text:
      'Votre code MagicPro : ' +
      code +
      '. Il expire dans 10 minutes. Ne le partagez pas.',
  };
  if (
    process.env.MAIL_TRANSPORT === 'local' &&
    process.env.NODE_ENV !== 'production'
  ) {
    const directory = path.resolve(
      process.env.MAIL_OUTBOX_DIR || 'tmp/mail-outbox',
    );
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(
      path.join(directory, challengeId + '.json'),
      JSON.stringify(message),
      { mode: 0o600 },
    );
    return;
  }
  if (!process.env.SMTP_HOST)
    throw new AppError(503, 'Le service de courriel n’est pas configuré');
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
  try {
    await transport.sendMail(message);
  } catch {
    throw new AppError(503, 'Envoi du code impossible. Réessayez.');
  } finally {
    transport.close();
  }
}
