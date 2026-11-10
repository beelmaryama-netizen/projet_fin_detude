import type { EmployeeService, EmployeePreferences } from '../types/employee';
import type { MissionDto, NotificationDto } from '../../../services/api/dto';
import { request } from '../../../services/api/transport';
import { missionFrom } from '../../../services/api/mappers';
import { uploadPhoto } from '../../../services/api/uploads';
const get = async (id: string) => missionFrom(await request<MissionDto>('GET', '/missions/' + id));
export const apiEmployeeService: EmployeeService = {
 async list() { return (await request<MissionDto[]>('GET', '/missions')).filter(m => m.status !== 'TO_ASSIGN').map(missionFrom); },
 get: (_user, id) => get(id),
 async start(user, { id, photos }) {
  const current = await get(id);
  for (const photo of photos) { if (!current.photos.some(p => p.id === photo.id)) await apiEmployeeService.addPhoto(user, { id, photo }); }
  if (current.status === 'PLANNED') await request('POST', '/missions/' + id + '/start');
  return get(id);
 },
 async toggle(_user, { id, itemId, isDone, note }) { await request('PATCH', '/missions/' + id + '/checklist/' + itemId, { isDone, note }); return get(id); },
 async addPhoto(_user, { id, photo }) { const fileKey = await uploadPhoto('MISSION', id, photo.uri); await request('POST', '/missions/' + id + '/photos', { fileKey, photoType: photo.phase, caption: photo.id }); return get(id); },
 async removePhoto(_user, { id, photoId }) { await request('DELETE', '/missions/' + id + '/photos/' + photoId); return get(id); },
 async complete(_user, { id, report }) { return missionFrom(await request<MissionDto>('POST', '/missions/' + id + '/complete', { note: report.note, incident: report.incident })); },
 async notifications() { const result = await request<{ items: NotificationDto[] }>('GET', '/notifications'); return result.items.filter(n => n.relatedEntityType === 'MISSION' && n.relatedEntityId).map(n => ({ id: n.id, title: n.title, message: n.body, missionId: n.relatedEntityId!, read: !!n.readAt, createdAt: n.createdAt })); },
 async readNotification(_user, id) { await request('POST', '/notifications/' + id + '/read'); },
 preferences: () => request<EmployeePreferences>('GET', '/preferences'),
 savePreferences: (_user, input) => request<EmployeePreferences>('PUT', '/preferences', input),
 async contact(_user, input) { return (await request<{ reference: string }>('POST', '/support', { ...input, subject: 'Intervention employé' })).reference; },
};
