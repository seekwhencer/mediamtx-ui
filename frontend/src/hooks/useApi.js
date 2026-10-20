import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useListQuery(queryKey, queryFn, { page = 0, itemsPerPage = 100, ...options } = {}) {
  return useQuery({
    queryKey: [...queryKey, page, itemsPerPage],
    queryFn: () => queryFn({ page, itemsPerPage }),
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
    staleTime: 5000,
    ...options,
  });
}

export function useMutationWithInvalidate(mutationFn, invalidateKeys) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    },
  });
}
