import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
const root = path.resolve('storage/documents');
const baseURL = () =>
  (process.env.PUBLIC_API_URL || 'http://localhost:3000/api').replace(
    /\/$/,
    '',
  );
const sign = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    audience: 'magicpro-documents',
    expiresIn: '15m',
  });
function decode(token, action) {
  try {
    const value = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      audience: 'magicpro-documents',
      algorithms: ['HS256'],
    });
    if (value.action !== action) throw Error();
    return value;
  } catch {
    throw new AppError(401, 'Lien document invalide ou expiré');
  }
}
async function access(user, id, edit = false, db = prisma) {
  const request = await db.serviceRequest.findUnique({ where: { id } });
  if (
    !request ||
    !['ADMIN', 'CLIENT'].includes(user.role) ||
    (user.role === 'CLIENT' && request.clientId !== user.id)
  )
    throw new AppError(404, 'Demande introuvable');
  if (
    edit &&
    (user.role !== 'CLIENT' ||
      request.requestType !== 'BUSINESS' ||
      !['NEW', 'UNDER_REVIEW', 'AWAITING_CLIENT'].includes(request.status))
  )
    throw new AppError(409, 'Documents non modifiables');
  return request;
}
export const documentDto = (document) => ({
  id: document.id,
  clientKey: document.clientKey,
  name: document.name,
  size: document.size,
  mimeType: 'application/pdf',
  uri:
    baseURL() +
    '/document-files/read?ticket=' +
    encodeURIComponent(sign({ action: 'read', id: document.id })),
});
export async function listDocuments(user, id) {
  await access(user, id);
  return (
    await prisma.requestDocument.findMany({
      where: { requestId: id },
      orderBy: { createdAt: 'asc' },
    })
  ).map(documentDto);
}
export async function documentSignature(user, id, input) {
  await access(user, id, true);
  return {
    uploadUrl:
      baseURL() +
      '/document-files/upload?ticket=' +
      encodeURIComponent(
        sign({ action: 'upload', userId: user.id, requestId: id, ...input }),
      ),
  };
}
export async function uploadDocument(token, body) {
  const payload = decode(token, 'upload');
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.status !== 'ACTIVE' || user.mustChangePassword)
    throw new AppError(403, 'Accès refusé');
  if (
    !Buffer.isBuffer(body) ||
    body.length < 12 ||
    body.length > 10 * 1024 * 1024 ||
    body.subarray(0, 5).toString() !== '%PDF-' ||
    !body.subarray(-1024).includes(Buffer.from('%%EOF'))
  )
    throw new AppError(400, 'Document PDF valide requis (10 Mo maximum)');
  const document = await prisma.$transaction(
    async (tx) => {
      await access(user, payload.requestId, true, tx);
      const existing = await tx.requestDocument.findUnique({
        where: {
          requestId_clientKey: {
            requestId: payload.requestId,
            clientKey: payload.clientKey,
          },
        },
      });
      if (existing) return existing;
      if (
        (await tx.requestDocument.count({
          where: { requestId: payload.requestId },
        })) >= 5
      )
        throw new AppError(409, 'Maximum 5 documents');
      const fileKey = crypto.randomUUID() + '.pdf';
      await fs.mkdir(root, { recursive: true });
      await fs.writeFile(path.join(root, fileKey), body, { flag: 'wx' });
      return tx.requestDocument.create({
        data: {
          requestId: payload.requestId,
          clientKey: payload.clientKey,
          name: payload.name,
          size: body.length,
          fileKey,
        },
      });
    },
    { isolationLevel: 'Serializable' },
  );
  return documentDto(document);
}
export async function readDocument(token) {
  const payload = decode(token, 'read');
  const document = await prisma.requestDocument.findUnique({
    where: { id: payload.id },
  });
  if (!document || !/^[a-f0-9-]+\.pdf$/.test(document.fileKey))
    throw new AppError(404, 'Document introuvable');
  try {
    return {
      data: await fs.readFile(path.join(root, document.fileKey)),
      name: document.name,
    };
  } catch {
    throw new AppError(404, 'Document introuvable');
  }
}
export async function removeDocument(user, id, documentId) {
  await access(user, id, true);
  const doc = await prisma.requestDocument.findFirst({
    where: { id: documentId, requestId: id },
  });
  if (!doc) throw new AppError(404, 'Document introuvable');
  await prisma.requestDocument.delete({ where: { id: doc.id } });
  if (/^[a-f0-9-]+\.pdf$/.test(doc.fileKey))
    await fs.unlink(path.join(root, doc.fileKey)).catch(() => {});
}
