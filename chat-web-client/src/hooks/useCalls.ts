/**
 * Calls Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query-client';
import type { InitiateCallRequest, PaginationParams } from '@/types/api.types';

export function useCallHistory(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.calls.history(params),
    queryFn: () => callsApi.getHistory(params),
    staleTime: 1 * 60 * 1000,
  });
}

export function useActiveCalls() {
  return useQuery({
    queryKey: queryKeys.calls.active,
    queryFn: callsApi.getActive,
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
  });
}

export function useInitiateCall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InitiateCallRequest) => callsApi.initiate(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.calls.active }),
    meta: { successMessage: 'Call initiated', errorMessage: 'Failed to initiate call' },
  });
}

export function useJoinCall() {
  return useMutation({
    mutationFn: (id: string) => callsApi.join(id),
    meta: { successMessage: 'Joined call', errorMessage: 'Failed to join call' },
  });
}

export function useEndCall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callsApi.end(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.active });
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.history() });
    },
    meta: { successMessage: 'Call ended' },
  });
}
