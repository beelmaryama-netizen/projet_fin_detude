import { Platform, AppState } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { apiBaseURL } from './config';
import { useRequestDraftStore } from '../../store/requestDraftStore';
import { useEmployeeDraftStore } from '../../features/employee/store/employeeDraftStore';
import { useLocalStatus } from '../../store/localStatusStore';
type RequestDraft = Pick<ReturnType<typeof useRequestDraftStore.getState>, 'category' | 'categoryDrafts' | 'residential' | 'business' | 'documents' | 'photos' | 'schedule' | 'submissionKey'>;
type EmployeeDraft = ReturnType<typeof useEmployeeDraftStore.getState>['drafts'];
interface Drafts { version: 1; requests: Record<string, RequestDraft>; employees: Record<string, EmployeeDraft> }
let data: Drafts = { version: 1, requests: {}, employees: {} };
const key = 'magicpro-api-drafts-' + encodeURIComponent(apiBaseURL);
const file = FileSystem.documentDirectory + key + '.json';
const clean = (value: ReturnType<typeof useRequestDraftStore.getState>): RequestDraft => ({ category: value.category, categoryDrafts: value.categoryDrafts, residential: value.residential, business: value.business, documents: value.documents, photos: value.photos, schedule: value.schedule, submissionKey: value.submissionKey });
let initialized = false;
let queue = Promise.resolve(); let timer: ReturnType<typeof setTimeout> | undefined;
export function saveApiDrafts(): Promise<void> {
 if (!initialized) return Promise.resolve();
 queue = queue.then(async () => {
  const value = JSON.stringify(data);
  if (Platform.OS === 'web') globalThis.localStorage.setItem(key, value);
  else { await FileSystem.writeAsStringAsync(file + '.pending', value); if ((await FileSystem.getInfoAsync(file)).exists) await FileSystem.copyAsync({ from: file, to: file + '.backup' }); await FileSystem.deleteAsync(file, { idempotent: true }); await FileSystem.moveAsync({ from: file + '.pending', to: file }); }
  useLocalStatus.setState({ error: undefined, lastSaved: new Date().toISOString() });
 }).catch(() => useLocalStatus.setState({ error: 'La sauvegarde du brouillon a échoué. Réessayez avant de fermer.' }));
 return queue;
}
const schedule = () => { clearTimeout(timer); timer = setTimeout(() => { void saveApiDrafts(); }, 300); };
export async function initializeApiDrafts() {
 if (initialized) return;
 const raw = Platform.OS === 'web' ? globalThis.localStorage.getItem(key) : (await FileSystem.getInfoAsync(file)).exists ? await FileSystem.readAsStringAsync(file) : (await FileSystem.getInfoAsync(file + '.backup')).exists ? await FileSystem.readAsStringAsync(file + '.backup') : null;
 if (raw) { const parsed = JSON.parse(raw) as Drafts; if (parsed.version !== 1 || !parsed.requests || !parsed.employees) throw Error('Sauvegarde de brouillon invalide'); data = parsed; }
 initialized = true;
 useRequestDraftStore.subscribe((state, previous) => {
  if (previous.ownerId && previous.ownerId !== state.ownerId) data.requests[previous.ownerId] = clean(previous);
  if (state.ownerId && previous.ownerId !== state.ownerId && data.requests[state.ownerId]) { useRequestDraftStore.setState(data.requests[state.ownerId]!); return; }
  if (state.ownerId) data.requests[state.ownerId] = clean(state); schedule();
 });
 useEmployeeDraftStore.subscribe((state, previous) => {
  if (previous.ownerId && previous.ownerId !== state.ownerId) data.employees[previous.ownerId] = previous.drafts;
  if (state.ownerId && state.ownerId !== previous.ownerId && data.employees[state.ownerId]) { useEmployeeDraftStore.setState({ drafts: data.employees[state.ownerId] }); return; }
  if (state.ownerId) data.employees[state.ownerId] = state.drafts; schedule();
 });
 AppState.addEventListener('change', state => { if (state !== 'active') void saveApiDrafts(); });
}
