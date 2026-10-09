import crypto from 'crypto';

// Mot de passe temporaire qui respecte les règles (majuscule + chiffre + 8 caractères min)
export function generateTempPassword() {
  const random = crypto.randomBytes(6).toString('base64url');
  return `Mp${random}7`;
}
