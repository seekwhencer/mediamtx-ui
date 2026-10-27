import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAutoRefresh } from './useAutoRefresh';

/**
 * Aufnahme-Status aller Pfade aus der Konfiguration.
 *
 * Liefert:
 *  - map:          Map<confName, boolean>  (record-Wert pro Config)
 *  - isRecording(confName): boolean | null
 *                   true  = nimmt auf (record=true)
 *                   false = keine Aufnahme (record=false)
 *                   null  = unbekannt (kein Config-Match, kein Default)
 *  - loading, error
 *
 * Fallback: pathDefaults.record (wenn ein Pfad keine eigene Config hat).
 * Refresh:  bestehende App-Setting autoRefreshMs (0 = aus).
 */
export function useRecordingMap() {
  const refetchInterval = useAutoRefresh();

  const configs = useQuery({
    queryKey: QUERY_KEYS.configPathsRecording,
    queryFn: () => api.get('/config/paths/list', { page: 0, itemsPerPage: 1000 }),
    refetchInterval,
    staleTime: 5000,
    retry: false,
  });

  const defaults = useQuery({
    queryKey: QUERY_KEYS.pathDefaults, // bestehenden Key wiederverwenden → Cache-Share mit ConfigPathDefaults
    queryFn: () => api.get('/config/path-defaults/get'),
    refetchInterval,
    staleTime: 5000,
    retry: false,
  });

  const map = useMemo(() => {
    const m = new Map();
    (configs.data?.items ?? []).forEach((c) => m.set(c.name, !!c.record));
    return m;
  }, [configs.data]);

  const defaultRecord = defaults.data?.record ?? null;

  const isRecording = (confName) => {
    if (confName && map.has(confName)) return map.get(confName);
    return defaultRecord; // true | false | null
  };

  return {
    map,
    isRecording,
    loading: configs.isPending,
    error: configs.error || defaults.error,
  };
}

export default useRecordingMap;
