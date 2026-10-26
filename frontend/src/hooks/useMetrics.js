import { useQuery } from '@tanstack/react-query';
import { localApi } from '../api/client';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAutoRefresh } from './useAutoRefresh';

/**
 * Metriken (GET /api/metrics) — Polling via useAutoRefresh (wie Dashboard).
 * Bei Fehler bleibt der letzte Snapshot sichtbar (placeholderData).
 */
export function useMetrics() {
  const refetchInterval = useAutoRefresh();
  return useQuery({
    queryKey: QUERY_KEYS.metrics,
    queryFn: () => localApi.get('/api/metrics').then((res) => res.data),
    refetchInterval,
    retry: false,
    placeholderData: (prev) => prev,
  });
}

export default useMetrics;
