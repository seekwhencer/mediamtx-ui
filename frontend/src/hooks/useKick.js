import { api } from '../api/client';
import { useMutationWithInvalidate } from './useApi';

// Kick-Mutation: POST <kickPath>/<id> (z. B. '/hls/sessions/kick'), onSuccess → invalidate.
export function useKick(kickPath, invalidateKeys) {
  return useMutationWithInvalidate((id) => api.post(`${kickPath}/${encodeURIComponent(id)}`), invalidateKeys);
}
