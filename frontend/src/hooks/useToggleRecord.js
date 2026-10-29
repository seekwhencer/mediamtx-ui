import { useMutationWithInvalidate } from './useApi';
import { api } from '../api/client';
import { QUERY_KEYS } from '../services/queryKeys';

/**
 * Toggle des record-Werts einer Path-Config.
 *
 * PATCH /config/paths/patch/{confName} mit { record: true|false }.
 * Invalidiert danach die Recording-Map, damit useRecordingMap neu lädt.
 */
export function useToggleRecord() {
  return useMutationWithInvalidate(
    ({ confName, record }) => api.patch(`/config/paths/patch/${encodeURIComponent(confName)}`, { record }),
    [QUERY_KEYS.configPathsRecording]
  );
}

export default useToggleRecord;
