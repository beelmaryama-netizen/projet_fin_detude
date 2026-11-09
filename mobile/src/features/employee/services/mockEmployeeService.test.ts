import { describe, it, expect } from 'vitest';
import { createMockEmployeeService } from './mockEmployeeService';
import { useEmployeeDraftStore } from '../store/employeeDraftStore';
import type { User } from '../../../types/identity';
const user: User = { id: 'employee-a', email: 'employee@magicpro.demo', firstName: 'Sarah', lastName: 'Démo', role: 'EMPLOYEE' };
const service = () => createMockEmployeeService({ latency: 0, now: () => Date.parse('2026-11-09T15:00:00Z') });
const id = user.id + '-today';
describe('employee journey', () => {
 it('restricts access by role, initial password and assignment', async () => {
  const api = service();
  await expect(api.list({ ...user, role: 'CLIENT' })).rejects.toThrow();
  await expect(api.list({ ...user, mustChangePassword: true })).rejects.toThrow();
  await expect(api.get({ ...user, id: 'other' }, id)).rejects.toThrow();
  expect(await api.list({ ...user, email: 'real@example.com' })).toEqual([]);
 });
 it('runs start, checklist and completion with immutable completed missions', async () => {
  const api = service(); const planned = await api.get(user, id);
  const itemId = planned.checklist[0]!.id;
  await expect(api.toggle(user, { id, itemId, isDone: true })).rejects.toThrow();
  const active = await api.start(user, { id, photos: [] });
  expect(active.status).toBe('IN_PROGRESS'); expect(active.startedAt).toBeTruthy();
  await expect(api.start(user, { id, photos: [] })).rejects.toThrow();
  expect((await api.toggle(user, { id, itemId, isDone: true })).checklist[0]!.isDone).toBe(true);
  expect((await api.complete(user, { id, report: { note: 'Entretien terminé', incident: '' } })).status).toBe('COMPLETED');
  await expect(api.toggle(user, { id, itemId, isDone: false })).rejects.toThrow();
  await expect(api.complete(user, { id, report: { note: '', incident: '' } })).rejects.toThrow();
  await expect(api.removePhoto(user, { id, photoId: 'photo' })).rejects.toThrow();
 });
 it('limits each photo phase to five and validates before photos', async () => {
  const api = service();
  const photo = { id: 'photo', uri: 'file:///photo.jpg', phase: 'AFTER' as const, createdAt: '2026-11-09T15:00:00Z' };
  await expect(api.start(user, { id, photos: [photo] })).rejects.toThrow();
  await api.start(user, { id, photos: [{ ...photo, id: 'before', phase: 'BEFORE' }] });
  for (let n = 0; n < 5; n++) await api.addPhoto(user, { id, photo: { ...photo, id: String(n) } });
  await expect(api.addPhoto(user, { id, photo: { ...photo, id: 'six' } })).rejects.toThrow();
  await api.removePhoto(user, { id, photoId: '0' });
  expect((await api.get(user, id)).photos).toHaveLength(5);
 });
 it('does not expose mutable database references', async () => {
  const api = service(); const list = await api.list(user); list[0]!.checklist[0]!.isDone = true;
  expect((await api.get(user, id)).checklist[0]!.isDone).toBe(false);
 });
 it('keeps preferences and notifications scoped to each employee', async () => {
  const api = service(); const other = { ...user, id: 'other' };
  await api.savePreferences(user, { assignments: false, changes: false });
  expect((await api.preferences(other)).assignments).toBe(true);
  const notifications = await api.notifications(user);
  await api.readNotification(user, notifications[0]!.id);
  expect((await api.notifications(user))[0]!.read).toBe(true);
  expect((await api.notifications(other))[0]!.read).toBe(false);
 });
 it('preserves status on invalid report or simulated connection failure', async () => {
  let fail = false; const api = createMockEmployeeService({ latency: 0, fail: () => fail });
  await api.start(user, { id, photos: [] });
  await expect(api.complete(user, { id, report: { note: 'x'.repeat(1501), incident: '' } })).rejects.toThrow();
  fail = true;
  await expect(api.complete(user, { id, report: { note: '', incident: '' } })).rejects.toThrow();
  fail = false; expect((await api.get(user, id)).status).toBe('IN_PROGRESS');
 });
 it('clears drafts when changing accounts or signing out', () => {
  const state = useEmployeeDraftStore.getState();
  state.bindOwner(user.id); state.update(id, { note: 'Privé' });
  state.bindOwner('other'); expect(useEmployeeDraftStore.getState().drafts).toEqual({});
  state.update('other-mission', { note: 'Autre' }); state.bindOwner(null);
  expect(useEmployeeDraftStore.getState().drafts).toEqual({});
 });
});
