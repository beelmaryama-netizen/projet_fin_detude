import axios from 'axios';

/** Prepared transport, not instantiated or called by the mock authentication. */
export function createHttpClient(baseURL: string, getAccessToken: () => string | null) {
  const client = axios.create({ baseURL, timeout: 15_000, headers: { 'Content-Type': 'application/json' } });
  client.interceptors.request.use(config => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return client;
}
