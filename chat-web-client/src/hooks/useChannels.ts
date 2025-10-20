/**
 * Channels Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { channelsApi } from '@/lib/api/endpoints';
import { queryKeys, invalidateQueries } from '@/lib/query-client';
import type { CreateChannelRequest, UpdateChannelRequest, PaginationParams } from '@/types/api.types';

export function useChannels(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.channels.list(params),
    queryFn: () => channelsApi.getAll(params),
    staleTime: 1 * 60 * 1000,
  });
}

export function useChannel(id: string | null) {
  return useQuery({
    queryKey: queryKeys.channels.detail(id!),
    queryFn: () => channelsApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChannelRequest) => channelsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.channels.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all() });
    },
    meta: { successMessage: 'Channel created', errorMessage: 'Failed to create channel' },
  });
}

export function useSubscribeChannel() {
  return useMutation({
    mutationFn: (id: string) => channelsApi.subscribe(id),
    onSuccess: async (_, id) => await invalidateQueries.channel(id),
    meta: { successMessage: 'Subscribed to channel' },
  });
}

export function useUnsubscribeChannel() {
  return useMutation({
    mutationFn: (id: string) => channelsApi.unsubscribe(id),
    onSuccess: async (_, id) => await invalidateQueries.channel(id),
    meta: { successMessage: 'Unsubscribed from channel' },
  });
}
