import { initializeApiDrafts, saveApiDrafts } from './api/drafts';
import { apiMode } from './api/config';
import { restoreApiSession } from '../features/auth/services/apiAuthService';
import { useAdminFilterStore } from '../store/adminFilterStore';
import { Platform, AppState } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { clientServices } from '../features/client/services/clientServices';
import { employeeService } from '../features/employee/services/employeeService';
import { authService } from '../features/auth/services/authService';
import { useAdminStore } from '../features/employer/store/adminStore';
import type { AdminData } from '../features/employer/types/admin';
import { clientBridge, employeeBridge, initializeSharedWorkflow } from './localWorkflow';
import { useRequestDraftStore } from '../store/requestDraftStore';
import { useEmployeeDraftStore } from '../features/employee/store/employeeDraftStore';
import { useSupportStore } from '../store/supportStore';
import { useLocalStatus } from '../store/localStatusStore';
import { useAuthStore } from '../store/authStore';
import { queryClient } from './queryClient';
type RequestDraft = Omit<ReturnType<typeof useRequestDraftStore.getState>, 'ownerId'>;
type EmployeeDrafts = ReturnType<typeof useEmployeeDraftStore.getState>['drafts'];
interface Snapshot { filters?: ReturnType<typeof useAdminFilterStore.getState>['byOwner']; version: 1; auth: Awaited<ReturnType<typeof authService.snapshot>>; clients: ReturnType<typeof clientServices.snapshot>; employees: ReturnType<typeof employeeService.snapshot>; admin: AdminData; tickets: ReturnType<typeof useSupportStore.getState>['tickets']; requests: Record<string, RequestDraft>; drafts: Record<string, EmployeeDrafts>; }
const key = 'magicpro-workspace-v1'; const filename = FileSystem.documentDirectory + key + '.json';
let requests: Snapshot['requests'] = {}; let drafts: Snapshot['drafts'] = {}; let configured = false; let hydrated = false;
let queue: Promise<void> = Promise.resolve(); let timer: ReturnType<typeof setTimeout> | undefined;
async function read(): Promise<string | null> {
 if (Platform.OS === 'web') return globalThis.localStorage.getItem(key);
 const info = await FileSystem.getInfoAsync(filename); if (info.exists) return FileSystem.readAsStringAsync(filename);
 const backup = await FileSystem.getInfoAsync(filename + '.backup'); return backup.exists ? FileSystem.readAsStringAsync(filename + '.backup') : null;
}
async function write(value: string) {
 if (Platform.OS === 'web') { globalThis.localStorage.setItem(key, value); return; }
 await FileSystem.writeAsStringAsync(filename + '.pending', value);
 if ((await FileSystem.getInfoAsync(filename)).exists) await FileSystem.copyAsync({ from: filename, to: filename + '.backup' });
 await FileSystem.deleteAsync(filename, { idempotent: true });
 await FileSystem.moveAsync({ from: filename + '.pending', to: filename });
}
export function saveWorkspace(): Promise<void> {
 if (apiMode) return saveApiDrafts();
 if (!hydrated) return Promise.resolve();
 queue = queue.catch(() => undefined).then(async () => {
  const snapshot: Snapshot = { version: 1, filters: useAdminFilterStore.getState().byOwner, auth: await authService.snapshot(), clients: clientServices.snapshot(), employees: employeeService.snapshot(), admin: useAdminStore.getState(), tickets: useSupportStore.getState().tickets, requests, drafts };
  await write(JSON.stringify(snapshot)); useLocalStatus.setState({ lastSaved: new Date().toISOString(), error: undefined });
 }).catch(() => { useLocalStatus.setState({ error: 'La sauvegarde locale a échoué. Réessayez avant de fermer l’application.' }); });
 return queue;
}
function scheduleSave() { clearTimeout(timer); timer = setTimeout(() => { void saveWorkspace(); }, 250); }
function observe(object: object, names?: readonly string[]) {
 for (const [key, value] of Object.entries(object)) {
  if (names && !names.includes(key)) continue;
  if (typeof value !== 'function') continue;
  Reflect.set(object, key, async (...args: unknown[]) => { const result: unknown = await Reflect.apply(value, object, args); await saveWorkspace(); return result; });
 }
}
let initialization: Promise<void> | undefined;
export function initializeWorkspace(): Promise<void> {
 if (hydrated) return Promise.resolve();
 if (!initialization) initialization = hydrateWorkspace().finally(() => { initialization = undefined; });
 return initialization;
}
async function hydrateWorkspace() {
 try {
  if (apiMode) { await initializeApiDrafts(); await restoreApiSession(); hydrated = true; useLocalStatus.setState({ ready: true, error: undefined }); return; }
  if (!configured) {
   configured = true; initializeSharedWorkflow(); clientServices.connect(clientBridge); employeeService.connect(employeeBridge);
   authService.configureAccess(user => user.role !== 'EMPLOYEE' || useAdminStore.getState().employees.some(e => e.email.toLowerCase() === user.email.toLowerCase() && e.active));
   const send = clientServices.support.send;
   clientServices.support.send = async (user, input) => { await send(user, input); const reference = useSupportStore.getState().add(user, input.subject, input.message, input.reservationId ?? input.quoteId ?? input.requestId); await saveWorkspace(); return { reference }; };
   const contact = employeeService.contact;
   employeeService.contact = async (user, input) => { await contact(user, input); const reference = useSupportStore.getState().add(user, 'Intervention employé', input.message, input.missionId); await saveWorkspace(); return reference; };
   for (const service of [clientServices.requests, clientServices.quotes, clientServices.reservations, clientServices.addresses, clientServices.notifications]) observe(service);
   observe(employeeService, ['list','get','start','toggle','addPhoto','removePhoto','complete','notifications','readNotification','preferences','savePreferences']);
   observe(authService, ['login','socialLogin','register','verifyCode','resetPassword','updateProfile','changePassword','setMfa','provisionEmployee']);
   useAdminStore.subscribe((state, previous) => {
    if (!hydrated) return;
    scheduleSave();
    if (state.employees !== previous.employees) {
     const user = useAuthStore.getState().session?.user;
     if (user?.role === 'EMPLOYEE' && !state.employees.some(e => e.email === user.email && e.active)) { queryClient.clear(); useAuthStore.getState().clearSession(); }
    }
    void queryClient.invalidateQueries({ queryKey: ['client'] }); void queryClient.invalidateQueries({ queryKey: ['employee'] });
   });
   useSupportStore.subscribe(scheduleSave); useAdminFilterStore.subscribe(scheduleSave);
   useRequestDraftStore.subscribe((state, previous) => {
    if (!hydrated) return;
    if (previous.ownerId && previous.ownerId !== state.ownerId) requests[previous.ownerId] = JSON.parse(JSON.stringify(previous)) as RequestDraft;
    if (state.ownerId && state.ownerId !== previous.ownerId && requests[state.ownerId]) { useRequestDraftStore.setState({ ...requests[state.ownerId], ownerId: state.ownerId }); return; }
    if (state.ownerId) requests[state.ownerId] = JSON.parse(JSON.stringify(state)) as RequestDraft;
    scheduleSave();
   });
   useEmployeeDraftStore.subscribe((state, previous) => {
    if (!hydrated) return;
    if (previous.ownerId && previous.ownerId !== state.ownerId) drafts[previous.ownerId] = previous.drafts;
    if (state.ownerId && state.ownerId !== previous.ownerId && drafts[state.ownerId]) { useEmployeeDraftStore.setState({ drafts: drafts[state.ownerId] }); return; }
    if (state.ownerId) drafts[state.ownerId] = state.drafts; scheduleSave();
   });
   AppState.addEventListener('change', state => { if (state !== 'active') void saveWorkspace(); });
  }
  const raw = await read();
  if (raw) {
   const data = JSON.parse(raw) as Snapshot;
   if (data.version !== 1 || !Array.isArray(data.auth?.accounts) || !Array.isArray(data.admin?.requests)) throw new Error('Format de sauvegarde non reconnu.');
   useAdminFilterStore.setState({ byOwner: data.filters ?? {} });
   authService.restore(data.auth); clientServices.restore(data.clients); employeeService.restore(data.employees);
   useAdminStore.setState({ ...data.admin, ownerId: null }); useSupportStore.setState({ tickets: data.tickets ?? [] }); requests = data.requests ?? {}; drafts = data.drafts ?? {};
  }
  hydrated = true; useLocalStatus.setState({ ready: true, error: undefined }); await saveWorkspace();
 } catch { useLocalStatus.setState({ ready: false, error: apiMode ? 'Connexion au backend impossible. Vérifiez son adresse et réessayez.' : 'Impossible de lire la sauvegarde locale. Réessayez ; les données existantes sont conservées.' }); }
}
