import { getAppSettings } from '../services/appSettings';

// HLS-Base-URL-Auflösung: App-Settings-Override > Env > leer.
function resolveHlsBase() {
  const override = (getAppSettings().hlsBaseUrl || '').trim();
  if (override) return override.replace(/\/+$/, '');
  return (import.meta.env.VITE_MEDIAMTX_HLS_URL || '').trim().replace(/\/+$/, '');
}

export function buildHlsUrl(path) {
  const base = resolveHlsBase();
  if (!base || !path) return '';
  return `${base}/${encodeURIComponent(path)}/index.m3u8`;
}

export default buildHlsUrl;
