/**
 * Messages Hooks
 * React hooks for message management with TanStack Query and optimistic updates
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { messagesApi } from '@/lib/api/endpoints';
import { queryKeys, invalidateQueries } from '@/lib/query-client';
import { useAuthStore, useConversationStore } from '@/lib/stores';
import type { SendMessageRequest, UpdateMessageRequest, AddReactionRequest, PaginationParams } from '@/types/api.types';
import type { Message } from '@/types/entities.types';

/**
 * Get messages for a conversation with infinite scroll
 */
export function useMessages(conversationId: string | null, params?: PaginationParams) {
  return useInfiniteQuery({
    queryKey: queryKeys.messages.all(conversationId!, params),
    queryFn: ({ pageParam = 1 }) =>
      messagesApi.getByConversation(conversationId!, { ...params, page: pageParam, limit: 50 }),
    getNextPageParam: (lastPage) => {
      if (lastPage.currentPage < lastPage.totalPages) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for new messages
    meta: {
      errorMessage: 'Failed to load messages',
    },
  });
}

/**
 * Get single message by ID
 */
export function useMessage(id: string | null) {
  return useQuery({
    queryKey: queryKeys.messages.detail(id!),
    queryFn: () => messagesApi.getById(id!),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
    meta: {
      errorMessage: 'Failed to load message',
    },
  });
}

/**
 * Send message mutation with optimistic update
 */
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { clearDraft } = useConversationStore();

  return useMutation({
    mutationFn: (data: SendMessageRequest) => messagesApi.send(data),
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.messages.all(conversationId) });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(queryKeys.messages.all(conversationId));

      // Optimistically update with temporary message
      queryClient.setQueryData(queryKeys.messages.all(conversationId), (old: any) => {
        if (!old) return old;

        const tempMessage: Message = {
          id: `temp-${Date.now()}`,
          conversationId,
          senderId: user!.id,
          sender: user!,
          content: newMessage.content,
          type: newMessage.type as any,
          metadata: newMessage.metadata || null,
          reactions: [],
          attachments: [],
          isEdited: false,
          isPinned: false,
          isDeleted: false,
          parentMessageId: newMessage.parentMessageId || null,
          parentMessage: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return {
          ...old,
          pages: old.pages.map((page: any, index: number) =>
            index === 0
              ? { ...page, items: [tempMessage, ...page.items] }
              : page
          ),
        };
      });

      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.all(conversationId),
          context.previousMessages
        );
      }
    },
    onSuccess: () => {
      // Clear draft after successful send
      clearDraft(conversationId);
    },
    onSettled: async () => {
      // Refetch to get the real message from server
      await invalidateQueries.message(conversationId);
      await invalidateQueries.conversation(conversationId);
    },
    meta: {
      showErrorToast: true,
      errorMessage: 'Failed to send message',
    },
  });
}

/**
 * Update/edit message mutation
 */
export function useUpdateMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMessageRequest }) =>
      messagesApi.update(id, data),
    onSuccess: async (_, { id }) => {
      await invalidateQueries.message(conversationId, id);
    },
    meta: {
      successMessage: 'Message updated',
      errorMessage: 'Failed to update message',
    },
  });
}

/**
 * Delete message mutation
 */
export function useDeleteMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => messagesApi.delete(id),
    onSuccess: async () => {
      await invalidateQueries.message(conversationId);
      await invalidateQueries.conversation(conversationId);
    },
    meta: {
      successMessage: 'Message deleted',
      errorMessage: 'Failed to delete message',
    },
  });
}

/**
 * Add reaction mutation
 */
export function useAddReaction(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddReactionRequest }) =>
      messagesApi.addReaction(id, data),
    onSuccess: async (_, { id }) => {
      await invalidateQueries.message(conversationId, id);
    },
    meta: {
      showErrorToast: false, // Don't show error toast for reactions
    },
  });
}

/**
 * Remove reaction mutation
 */
export function useRemoveReaction(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, reactionId }: { messageId: string; reactionId: string }) =>
      messagesApi.removeReaction(messageId, reactionId),
    onSuccess: async (_, { messageId }) => {
      await invalidateQueries.message(conversationId, messageId);
    },
    meta: {
      showErrorToast: false,
    },
  });
}

/**
 * Pin message mutation
 */
export function usePinMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => messagesApi.pin(id),
    onSuccess: async (_, id) => {
      await invalidateQueries.message(conversationId, id);
      await invalidateQueries.conversation(conversationId);
    },
    meta: {
      successMessage: 'Message pinned',
      errorMessage: 'Failed to pin message',
    },
  });
}

/**
 * Unpin message mutation
 */
export function useUnpinMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => messagesApi.unpin(id),
    onSuccess: async (_, id) => {
      await invalidateQueries.message(conversationId, id);
      await invalidateQueries.conversation(conversationId);
    },
    meta: {
      successMessage: 'Message unpinned',
      errorMessage: 'Failed to unpin message',
    },
  });
}

/**
 * Forward message mutation
 */
export function useForwardMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, conversationIds }: { id: string; conversationIds: string[] }) =>
      messagesApi.forward(id, conversationIds),
    onSuccess: async (_, { conversationIds }) => {
      // Invalidate all target conversations
      await Promise.all(
        conversationIds.map((convId) => invalidateQueries.conversation(convId))
      );
    },
    meta: {
      successMessage: 'Message forwarded successfully',
      errorMessage: 'Failed to forward message',
    },
  });
}

/**
 * Get message thread (replies)
 */
export function useMessageThread(messageId: string | null, params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.messages.thread(messageId!, params),
    queryFn: () => messagesApi.getThread(messageId!, params),
    enabled: !!messageId,
    staleTime: 30 * 1000,
    meta: {
      errorMessage: 'Failed to load thread',
    },
  });
}
