import { getAppSettings } from '../services/appSettings';

// HLS-Base-URL-Auflösung: App-Settings-Override > Env > window.location.origin.
function resolveHlsBase() {
  const override = (getAppSettings().hlsBaseUrl || '').trim();
  if (override) return override.replace(/\/+$/, '');
  const env = (import.meta.env.MEDIAMTX_HLS_URL || '').trim();
  if (env) return env.replace(/\/+$/, '');
  // Fallback: aktuelle window location (protocol + host + port), damit das Theatre
  // ohne jegliche Konfiguration funktioniert. SSR-sicher (window-Check).
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return '';
}

export function buildHlsUrl(path) {
  const base = resolveHlsBase();
  if (!base || !path) return '';
  return `${base}/${encodeURIComponent(path)}/index.m3u8`;
}

export default buildHlsUrl;
