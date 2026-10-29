import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { QUERY_KEYS } from '../services/queryKeys';

/**
 * Liefert den Aktivierungs-Status eines Protokolls aus der globalen Konfiguration.
 *
 * - `loading` ist true, solange die Konfiguration noch nicht geladen ist.
 * - `enabled` ist true, nur wenn die Konfiguration geladen ist UND das Protokoll aktiviert ist.
 *
 * Solange `loading` true ist, darf keine Anfrage an das Protokoll gestellt werden,
 * da sonst ein 404 erzeugt wird, wenn das Protokoll deaktiviert ist.
 */
export function useProtocolState(flag) {
  const { data, isPending } = useQuery({
    queryKey: QUERY_KEYS.globalConfig,
    queryFn: () => api.get('/config/global/get'),
    retry: false,
  });
  const loading = isPending;
  const enabled = !loading && data?.[flag] !== false;
  return { enabled, loading };
}

/**
 * Backward-kompatible Wrapper: liefert nur den Boolean.
 * Während des Ladens wird false zurückgegeben (keine optimistische true),
 * um 404s für deaktivierte Protokolle zu vermeiden.
 */
export function useProtocolEnabled(flag) {
  return useProtocolState(flag).enabled;
}

export default useProtocolEnabled;
