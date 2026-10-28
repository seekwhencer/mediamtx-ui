import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { QUERY_KEYS } from '../services/queryKeys';

/**
 * Liefert true, wenn das Protokoll in der globalen Konfiguration aktiviert ist.
 * Solange die Konfiguration noch lädt (oder fehlgeschlagen ist), wird true
 * zurückgegeben, um das bisherige Verhalten (Polling) beizubehalten.
 */
export function useProtocolEnabled(flag) {
  const { data } = useQuery({
    queryKey: QUERY_KEYS.globalConfig,
    queryFn: () => api.get('/config/global/get'),
    retry: false,
  });
  return data?.[flag] !== false;
}

export default useProtocolEnabled;
