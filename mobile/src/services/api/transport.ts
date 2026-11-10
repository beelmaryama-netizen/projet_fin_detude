import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { apiBaseURL } from './config';
import { tokenStorage } from '../tokenStorage';
import { useAuthStore } from '../../store/authStore';
import { queryClient } from '../queryClient';
import type { Session } from '../../types/identity';

export class ApiError extends Error { constructor(message: string, public status = 0) { super(message); this.name = 'ApiError'; } }
export const unavailable = (feature: string): never => { throw new ApiError(feature + ' : cette fonction n’est pas encore disponible sur le serveur.'); };
export const http = axios.create({ baseURL: apiBaseURL, timeout: 20000 });
const publicHttp = axios.create({ baseURL: apiBaseURL, timeout: 20000 });
type RetryConfig = InternalAxiosRequestConfig & { retried?: boolean; sessionId?: string; sessionEpoch?: number; accessToken?: string };
let epoch = 0;
let refreshing: Promise<string> | undefined;
export function resetApiSession() { epoch++; refreshing = undefined; useAuthStore.getState().clearSession(); queryClient.clear(); return tokenStorage.clear(); }
export async function keepSession(session: Session) { await tokenStorage.write(session.refreshToken); useAuthStore.getState().setSession(session); }
function checkURL() { if (!/^https?:\/\//.test(apiBaseURL)) throw new ApiError('Configurez EXPO_PUBLIC_API_URL avec l’adresse du backend (http://IP_DU_PC:3000/api).'); }
http.interceptors.request.use(config => {
 checkURL(); const request = config as RetryConfig; const session = useAuthStore.getState().session;
 request.sessionId ??= session?.user.id; request.sessionEpoch ??= epoch;
 if (session) { request.headers.Authorization = 'Bearer ' + session.accessToken; request.accessToken = session.accessToken; }
 return request;
});
export function apiError(error: unknown): ApiError {
 if (error instanceof ApiError) return error;
 if (axios.isAxiosError<{ message?: string; error?: string }>(error)) return new ApiError(error.response?.data?.message ?? error.response?.data?.error ?? 'Connexion au serveur impossible. Vérifiez que le backend est démarré et accessible.', error.response?.status);
 return new ApiError('La réponse du serveur n’a pas pu être traitée.');
}
http.interceptors.response.use(response => { const config = response.config as RetryConfig; if (config.sessionId && (config.sessionId !== useAuthStore.getState().session?.user.id || config.sessionEpoch !== epoch)) throw new ApiError('Cette réponse appartient à une ancienne session.'); return response; }, async (cause: unknown) => {
 if (!axios.isAxiosError(cause)) throw apiError(cause);
 const config = cause.config as RetryConfig | undefined;
 const session = useAuthStore.getState().session;
 if (cause.response?.status === 401 && config && !config.retried && session && config.sessionId === session.user.id && config.sessionEpoch === epoch) {
  config.retried = true;
  try {
   if (config.accessToken !== session.accessToken) return await http.request(config);
   if (!refreshing) {
    const captured = epoch; const userId = session.user.id;
    refreshing = publicRequest<{ accessToken: string; refreshToken: string }>('POST', '/auth/refresh', { refreshToken: session.refreshToken }).then(async tokens => {
     if (captured !== epoch || useAuthStore.getState().session?.user.id !== userId) throw new ApiError('Session modifiée. Reconnectez-vous.');
     await keepSession({ ...session, ...tokens, expiresAt: Date.now() + 14 * 60000 }); return tokens.accessToken;
    }).finally(() => { refreshing = undefined; });
   }
   await refreshing; return await http.request(config);
  } catch (error) { if (apiError(error).status === 401 || apiError(error).status === 403) await resetApiSession(); throw apiError(error); }
 }
 throw apiError(cause);
});
export async function publicRequest<T>(method: string, url: string, data?: unknown): Promise<T> {
 checkURL(); try { return (await publicHttp.request<T>({ method, url, data })).data; } catch (error) { throw apiError(error); }
}
export async function request<T>(method: string, url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
 return (await http.request<T>({ ...config, method, url, data })).data;
}
export async function allPages<T>(url: string): Promise<T[]> {
 const items: T[] = []; let page = 1;
 for (;;) { const result = await request<{ items: T[]; totalPages: number }>('GET', url, undefined, { params: { page, pageSize: 50 } }); items.push(...result.items); if (page >= result.totalPages) return items; page++; }
}
