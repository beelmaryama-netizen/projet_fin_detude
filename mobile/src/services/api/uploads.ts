import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { request, ApiError } from './transport';
interface Signature { uploadUrl: string; apiKey: string; signature: string; timestamp: number; folder: string; type: string }
export async function uploadPhoto(target: 'REQUEST' | 'MISSION', id: string, uri: string) {
 const signed = await request<Signature & { storage?: 'local'; fileKey?: string }>('POST', '/uploads/signature', { target, id });
 if (signed.storage === 'local') {
  let ok: boolean;
  if (Platform.OS === 'web') { const file = await (await fetch(uri)).blob(); ok = (await fetch(signed.uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type || 'image/jpeg' }, body: file })).ok; }
  else { const result = await FileSystem.uploadAsync(signed.uploadUrl, uri, { httpMethod: 'POST', uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT, headers: { 'Content-Type': 'image/jpeg' } }); ok = result.status >= 200 && result.status < 300; }
  if (!ok || !signed.fileKey) throw new ApiError('Le transfert de la photo a échoué. Réessayez.'); return signed.fileKey;
 }
 const form = new FormData();
 if (Platform.OS === 'web') form.append('file', await (await fetch(uri)).blob(), 'photo.jpg');
 else form.append('file', { uri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob);
 form.append('api_key', signed.apiKey); form.append('signature', signed.signature); form.append('timestamp', String(signed.timestamp)); form.append('folder', signed.folder); form.append('type', signed.type);
 const response = await fetch(signed.uploadUrl, { method: 'POST', body: form });
 if (!response.ok) throw new ApiError('Le transfert de la photo a échoué. Réessayez.');
 const data: unknown = await response.json();
 if (!data || typeof data !== 'object' || !('public_id' in data) || typeof data.public_id !== 'string') throw new ApiError('Réponse du stockage photo invalide.');
 return data.public_id;
}
