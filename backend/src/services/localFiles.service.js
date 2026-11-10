import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
const root = path.resolve('storage');
export const localFilesEnabled = () => process.env.FILE_STORAGE !== 'cloudinary';
const publicURL = () => (process.env.PUBLIC_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
function filename(key) {
 if (!/^magicpro\/(requests|missions)\/[a-f0-9-]+\/[a-f0-9-]+$/.test(key)) throw new AppError(400, 'Clé de fichier invalide');
 const result = path.resolve(root, key); if (!result.startsWith(root + path.sep)) throw new AppError(400, 'Clé de fichier invalide'); return result;
}
function sign(payload) { return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m', audience: 'magicpro-files' }); }
export function localReadUrl(key) { filename(key); return publicURL() + '/files/read?ticket=' + encodeURIComponent(sign({ key, action: 'read' })); }
export function localUploadSignature(user, target, id) { const key = 'magicpro/' + (target === 'REQUEST' ? 'requests/' : 'missions/') + id + '/' + crypto.randomUUID(); return { storage: 'local', fileKey: key, uploadUrl: publicURL() + '/files/upload?ticket=' + encodeURIComponent(sign({ key, action: 'upload', userId: user.id, target, id })) }; }
function ticket(value, action) {
 try { const payload = jwt.verify(value, process.env.JWT_ACCESS_SECRET, { audience: 'magicpro-files' }); if (payload.action !== action) throw Error(); filename(payload.key); return payload; } catch { throw new AppError(401, 'Lien fichier invalide ou expiré'); }
}
export async function readFile(value) {
 const payload = ticket(value, 'read');
 const file = filename(payload.key);
 try { const data = await fs.readFile(file); return { data, type: data[0] === 0x89 ? 'image/png' : 'image/jpeg' }; } catch { throw new AppError(404, 'Photo introuvable'); }
}
export async function storeFile(value, body) {
 const payload = ticket(value, 'upload');
 const user = await prisma.user.findUnique({ where: { id: payload.userId } });
 if (!user || user.status !== 'ACTIVE' || user.mustChangePassword) throw new AppError(403, 'Accès refusé');
 if (payload.target === 'REQUEST') {
  if (user.role !== 'CLIENT' || !await prisma.serviceRequest.findFirst({ where: { id: payload.id, clientId: user.id, status: { in: ['NEW','UNDER_REVIEW','AWAITING_CLIENT'] } } })) throw new AppError(403, 'Accès refusé');
 } else if (!['ADMIN','EMPLOYEE'].includes(user.role) || !await prisma.mission.findFirst({ where: { id: payload.id, status: { in: ['TO_ASSIGN','PLANNED','IN_PROGRESS'] }, ...(user.role === 'EMPLOYEE' && { assignments: { some: { employeeId: user.id, status: 'ACTIVE' } } }) } })) throw new AppError(403, 'Accès refusé');
 if (!Buffer.isBuffer(body) || body.length < 8 || !(body.subarray(0,3).equals(Buffer.from([255,216,255])) || body.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))) throw new AppError(400, 'Photo JPEG ou PNG requise');
 const file = filename(payload.key); await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, body, { flag: 'wx' }).catch(error => { if (error.code !== 'EEXIST') throw error; }); return { public_id: payload.key };
}
