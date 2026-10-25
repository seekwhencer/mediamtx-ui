import axios from 'axios';
import { getAppSettings } from '../services/appSettings';

// Base-URL-Auflösung pro Request: App-Settings-Override > Env > /v3.
function resolveBaseURL() {
  const override = (getAppSettings().apiBaseUrl || '').trim();
  if (override) return override.replace(/\/+$/, '');
  return import.meta.env.MEDIAMTX_API_URL || '/v3';
}

const client = axios.create({
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Response-Interceptor: liefert res.data direkt, mappt Fehler auf Error mit code/status.
client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error || err.message;
    const code = err.response?.data?.code || 'unknown';
    const e = new Error(msg);
    e.code = code;
    e.status = err.response?.status;
    throw e;
  }
);

// MediaMTX-API (via Bridge) — Base-URL wird pro Request aufgelöst.
export const api = {
  get: (path, params) => client.get(path, { params, baseURL: resolveBaseURL() }),
  post: (path, body) => client.post(path, body, { baseURL: resolveBaseURL() }),
  patch: (path, body) => client.patch(path, body, { baseURL: resolveBaseURL() }),
  delete: (path, params) => client.delete(path, { params, baseURL: resolveBaseURL() }),
};

// Server-eigene Endpunkte (Einstellungen) — nicht an MediaMTX proxied.
export const localApi = {
  get: (path, params) => client.get(path, { params, baseURL: '' }),
  patch: (path, body) => client.patch(path, body, { baseURL: '' }),
};

export default client;
