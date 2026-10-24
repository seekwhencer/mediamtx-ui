import { useSyncExternalStore } from 'react';
import { defaultPrimaryHue } from '../utils/primaryColor';
import { defaultRadiusFactor } from '../utils/radius';

const KEY = 'mtxui.appSettings';

export const APP_SETTINGS_DEFAULTS = {
  apiBaseUrl: '', // '' → Default (VITE_MEDIAMTX_API_URL oder /v3)
  hlsBaseUrl: '', // '' → Default (VITE_MEDIAMTX_HLS_URL)
  playbackBaseUrl: '', // '' → Default (VITE_MEDIAMTX_PLAYBACK_URL)
  theme: 'dark', // 'dark' | 'light'
  primaryHue: defaultPrimaryHue(), // Farbton (0-360); Sättigung + Helligkeit fix (s. primaryColor.js)
  radiusFactor: defaultRadiusFactor(), // Roundness (0-1); skaliert --radius-* (s. radius.js)
  autoRefreshMs: 10000, // 0 = aus
  itemsPerPage: 100,
};

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return { ...APP_SETTINGS_DEFAULTS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...APP_SETTINGS_DEFAULTS };
  }
}

let cache = read();
const listeners = new Set();

export function getAppSettings() {
  return cache;
}

export function setAppSettings(patch) {
  cache = { ...cache, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // localStorage nicht verfügbar (z. B. Private Mode) → nur In-Memory
  }
  listeners.forEach((listener) => listener());
}

export function subscribeAppSettings(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** React-Hook: reagiert auf Änderungen der App-Settings. */
export function useAppSettings() {
  return useSyncExternalStore(subscribeAppSettings, getAppSettings, getAppSettings);
}
