/**
 * Conversations Hooks
 * React hooks for conversation management with TanStack Query
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { conversationsApi } from '@/lib/api/endpoints';
import { queryKeys, invalidateQueries } from '@/lib/query-client';
import { useConversationStore } from '@/lib/stores';
import type { CreateConversationRequest, UpdateConversationRequest, PaginationParams } from '@/types/api.types';

/**
 * Get all conversations with pagination
 */
export function useConversations(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.conversations.all(params),
    queryFn: () => conversationsApi.getAll(params),
    staleTime: 30 * 1000, // 30 seconds
    meta: {
      errorMessage: 'Failed to load conversations',
    },
  });
}

/**
 * Get conversations with infinite scroll
 */
export function useInfiniteConversations() {
  return useInfiniteQuery({
    queryKey: queryKeys.conversations.all(),
    queryFn: ({ pageParam = 1 }) => conversationsApi.getAll({ page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => {
      if (lastPage.currentPage < lastPage.totalPages) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000,
  });
}

/**
 * Get conversation by ID
 */
export function useConversation(id: string | null) {
  return useQuery({
    queryKey: queryKeys.conversations.detail(id!),
    queryFn: () => conversationsApi.getById(id!),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
    meta: {
      errorMessage: 'Failed to load conversation',
    },
  });
}

/**
 * Create conversation mutation
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { setSelectedConversation } = useConversationStore();

  return useMutation({
    mutationFn: (data: CreateConversationRequest) => conversationsApi.create(data),
    onSuccess: (newConversation) => {
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all() });

      // Set as selected conversation
      setSelectedConversation(newConversation.id, newConversation);
    },
    meta: {
      successMessage: 'Conversation created successfully',
      errorMessage: 'Failed to create conversation',
    },
  });
}

/**
 * Update conversation mutation
 */
export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConversationRequest }) =>
      conversationsApi.update(id, data),
    onSuccess: async (_, { id }) => {
      await invalidateQueries.conversation(id);
    },
    meta: {
      successMessage: 'Conversation updated successfully',
      errorMessage: 'Failed to update conversation',
    },
  });
}

/**
 * Delete conversation mutation
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const { setSelectedConversation } = useConversationStore();

  return useMutation({
    mutationFn: (id: string) => conversationsApi.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.conversations.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all() });

      // Clear selection if this was selected
      setSelectedConversation(null);
    },
    meta: {
      successMessage: 'Conversation deleted successfully',
      errorMessage: 'Failed to delete conversation',
    },
  });
}

/**
 * Leave conversation mutation
 */
export function useLeaveConversation() {
  const queryClient = useQueryClient();
  const { setSelectedConversation } = useConversationStore();

  return useMutation({
    mutationFn: (id: string) => conversationsApi.leave(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.conversations.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all() });

      // Clear selection if this was selected
      setSelectedConversation(null);
    },
    meta: {
      successMessage: 'Left conversation successfully',
      errorMessage: 'Failed to leave conversation',
    },
  });
}

/**
 * Mark conversation as read mutation
 */
export function useMarkConversationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => conversationsApi.markAsRead(id),
    onSuccess: async (_, id) => {
      await invalidateQueries.conversation(id);
    },
    meta: {
      showErrorToast: false, // Don't show error for read receipts
    },
  });
}

/**
 * Add participants mutation
 */
export function useAddParticipants() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
      conversationsApi.addParticipants(id, userIds),
    onSuccess: async (_, { id }) => {
      await invalidateQueries.conversation(id);
    },
    meta: {
      successMessage: 'Participants added successfully',
      errorMessage: 'Failed to add participants',
    },
  });
}

/**
 * Remove participant mutation
 */
export function useRemoveParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      conversationsApi.removeParticipant(id, userId),
    onSuccess: async (_, { id }) => {
      await invalidateQueries.conversation(id);
    },
    meta: {
      successMessage: 'Participant removed successfully',
      errorMessage: 'Failed to remove participant',
    },
  });
}

/**
 * Get or create self-conversation (for personal notes/bookmarks)
 */
export function useSelfConversation() {
  return useQuery({
    queryKey: queryKeys.conversations.self,
    queryFn: () => conversationsApi.getSelf(),
    staleTime: Infinity, // Cache forever - self-conversation doesn't change
    meta: {
      errorMessage: 'Failed to load self-conversation',
      showErrorToast: false, // Don't show error toast for self-conversation
    },
  });
}
