import { useAppSettings } from '../services/appSettings';

/**
 * Refresh-Intervall aus den App-Settings (0 = aus).
 * Reagiert auf Änderungen ohne Reload.
 */
export function useAutoRefresh() {
  const { autoRefreshMs } = useAppSettings();
  return autoRefreshMs || false;
}
