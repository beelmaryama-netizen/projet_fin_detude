import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
vi.mock('./config', () => ({ apiBaseURL: 'http://localhost:3000/api', apiMode: true }));
vi.mock('../tokenStorage', () => ({ tokenStorage: { read: async () => null, write: async () => undefined, clear: async () => undefined } }));
const original = axios.defaults.adapter;
beforeEach(() => vi.resetModules());
afterEach(() => { axios.defaults.adapter = original; });
const response = (config: InternalAxiosRequestConfig, data: unknown, status = 200) => ({ data, status, statusText: String(status), headers: new AxiosHeaders(), config });
const session = { user: { id: 'client', firstName: 'Test', lastName: 'Client', email: 'client@test.ca', role: 'CLIENT' as const }, accessToken: 'expired', refreshToken: 'refresh', expiresAt: 1 };
it('rotates one refresh token for concurrent expired requests and retries with the new token', async () => {
 let refreshes = 0;
 axios.defaults.adapter = async config => {
  if (config.url === '/auth/refresh') { refreshes++; await new Promise(resolve => setTimeout(resolve, 15)); return response(config, { accessToken: 'fresh', refreshToken: 'rotated' }); }
  if (config.headers.Authorization !== 'Bearer fresh') throw new AxiosError('expired', 'ERR_BAD_REQUEST', config, undefined, response(config, {}, 401));
  return response(config, { ok: true });
 };
 const transport = await import('./transport'); await transport.keepSession(session);
 const result = await Promise.all([transport.request('GET','/requests'), transport.request('GET','/appointments')]);
 expect(result).toEqual([{ ok: true }, { ok: true }]); expect(refreshes).toBe(1);
});
it('clears an invalid session and never silently falls back to demo data', async () => {
 axios.defaults.adapter = async config => { throw new AxiosError('revoked', 'ERR_BAD_REQUEST', config, undefined, response(config, { message: 'Session révoquée' }, 401)); };
 const transport = await import('./transport'); await transport.keepSession(session);
 await expect(transport.request('GET','/requests')).rejects.toThrow('Session révoquée');
 const { useAuthStore } = await import('../../store/authStore'); expect(useAuthStore.getState().session).toBeNull();
});
