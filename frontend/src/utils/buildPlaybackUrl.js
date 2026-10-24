import { getAppSettings } from '../services/appSettings';

// Playback-Base-URL-Auflösung: App-Settings-Override > Env > leer.
function resolvePlaybackBase() {
  const override = (getAppSettings().playbackBaseUrl || '').trim();
  if (override) return override.replace(/\/+$/, '');
  return (import.meta.env.VITE_MEDIAMTX_PLAYBACK_URL || '').trim().replace(/\/+$/, '');
}

/**
 * Baut die Wiedergabe-URL für ein Aufnahmen-Segment.
 * @param {object} p
 * @param {string} p.path     - Pfadname (z. B. 'cam1')
 * @param {string} p.start    - Startzeit (RFC3339 / ISO)
 * @param {number} [p.duration] - Dauer in Sekunden (Default: groß → Server cappt auf echte Länge)
 * @param {'fmp4'|'mp4'} [p.format] - Container (Default: fmp4, browser-ready)
 * @returns {string} z. B. 'http://…:9996/get?path=cam1&start=…&duration=999999&format=fmp4'
 */
export function buildPlaybackUrl({ path, start, duration = 999999, format = 'fmp4' }) {
  const base = resolvePlaybackBase();
  if (!base || !path || !start) return '';
  const params = new URLSearchParams({
    path,
    start,
    duration: String(duration),
    format,
  });
  return `${base}/get?${params.toString()}`;
}

export default buildPlaybackUrl;
