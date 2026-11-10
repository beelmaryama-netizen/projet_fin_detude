import * as Crypto from 'expo-crypto';
// Salted fingerprints for the local simulator only. Production authentication stays server-side.
export async function encodeLocalPassword(password: string) {
 const salt = Crypto.randomUUID();
 return 'sha256$' + salt + '$' + await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, salt + ':' + password);
}
export async function verifyLocalPassword(password: string, stored: string) {
 if (!stored.startsWith('sha256$')) return password === stored;
 const [, salt, hash] = stored.split('$'); if (!salt || !hash) return false;
 return hash === await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, salt + ':' + password);
}
