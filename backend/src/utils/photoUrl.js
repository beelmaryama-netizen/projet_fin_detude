import { cloudinary } from '../config/cloudinary.js';

// Fichiers privés (section 11) : upload "authenticated", lecture via URL signée
export function signedPhotoUrl(fileKey) {
  try {
    return cloudinary.url(fileKey, { type: 'authenticated', sign_url: true, secure: true });
  } catch {
    // Cloudinary non configuré (.env) : on renvoie la photo sans URL plutôt que de casser la requête
    return null;
  }
}

export function withUrls(photos = []) {
  return photos.map((p) => ({ ...p, url: signedPhotoUrl(p.fileKey) }));
}
