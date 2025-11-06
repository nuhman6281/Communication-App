/**
 * TanStack Query Client Configuration
 * Sets up the React Query client with default options and error handling
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractErrorMessage } from './api/client';

// Create query client with default options
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only show error toasts if we have a query key
      if (query.meta?.errorMessage) {
        toast.error(query.meta.errorMessage as string);
      } else {
        const message = extractErrorMessage(error);
        toast.error(`Query Error: ${message}`);
      }
    },
  }),

  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // Only show error toasts if mutation has error handling enabled
      if (mutation.meta?.errorMessage) {
        toast.error(mutation.meta.errorMessage as string);
      } else if (mutation.meta?.showErrorToast !== false) {
        const message = extractErrorMessage(error);
        toast.error(`Action Failed: ${message}`);
      }
    },

    onSuccess: (_data, _variables, _context, mutation) => {
      // Show success toast if mutation has success message
      if (mutation.meta?.successMessage) {
        toast.success(mutation.meta.successMessage as string);
      }
    },
  }),

  defaultOptions: {
    queries: {
      // Stale time: Data is considered fresh for 1 minute
      staleTime: 1 * 60 * 1000, // 1 minute

      // Cache time: Inactive queries are garbage collected after 5 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)

      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for network errors and 5xx errors
        return failureCount < 3;
      },

      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus for real-time updates
      refetchOnWindowFocus: true,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Don't refetch on mount if data is still fresh
      refetchOnMount: true,

      // Network mode: always fetch (even when offline, will queue)
      networkMode: 'online',
    },

    mutations: {
      // Retry failed mutations once
      retry: 1,

      // Network mode for mutations
      networkMode: 'online',

      // Error handling
      onError: (error: any) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

/**
 * Query key factory
 * Centralized query key management for consistency
 */
export const queryKeys = {
  // Auth
  auth: {
    currentUser: ['auth', 'currentUser'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
    search: (params?: Record<string, unknown>) => ['users', 'search', params] as const,
    me: () => ['users', 'me'] as const,
    blocked: ['users', 'blocked'] as const,
  },

  // Conversations
  conversations: {
    all: (params?: Record<string, unknown>) => ['conversations', params] as const,
    detail: (id: string) => ['conversations', id] as const,
    self: ['conversations', 'self'] as const,
  },

  // Messages
  messages: {
    all: (conversationId: string, params?: Record<string, unknown>) =>
      ['messages', conversationId, params] as const,
    detail: (id: string) => ['messages', 'detail', id] as const,
    thread: (id: string, params?: Record<string, unknown>) =>
      ['messages', 'thread', id, params] as const,
  },

  // Groups
  groups: {
    all: ['groups'] as const,
    list: (params?: Record<string, unknown>) => ['groups', params] as const,
    detail: (id: string) => ['groups', id] as const,
    members: (id: string, params?: Record<string, unknown>) =>
      ['groups', id, 'members', params] as const,
    settings: (id: string) => ['groups', id, 'settings'] as const,
  },

  // Channels
  channels: {
    all: ['channels'] as const,
    list: (params?: Record<string, unknown>) => ['channels', params] as const,
    detail: (id: string) => ['channels', id] as const,
    members: (id: string, params?: Record<string, unknown>) =>
      ['channels', id, 'members', params] as const,
    search: (params?: Record<string, unknown>) =>
      ['channels', 'search', params] as const,
  },

  // Stories
  stories: {
    all: (params?: Record<string, unknown>) => ['stories', params] as const,
    detail: (id: string) => ['stories', id] as const,
    mine: ['stories', 'mine'] as const,
    byUser: (userId: string) => ['stories', 'user', userId] as const,
    active: ['stories', 'active'] as const,
    archived: (params?: Record<string, unknown>) => ['stories', 'archived', params] as const,
    views: (id: string, params?: Record<string, unknown>) =>
      ['stories', id, 'views', params] as const,
    replies: (id: string) => ['stories', id, 'replies'] as const,
    myHighlights: ['stories', 'highlights', 'mine'] as const,
    highlights: (userId: string) => ['stories', 'highlights', userId] as const,
    stats: (id: string) => ['stories', id, 'stats'] as const,
  },

  // Calls
  calls: {
    all: ['calls'] as const,
    detail: (id: string) => ['calls', id] as const,
    history: (params?: Record<string, unknown>) => ['calls', 'history', params] as const,
    active: ['calls', 'active'] as const,
    missed: (params?: Record<string, unknown>) => ['calls', 'missed', params] as const,
    participants: (id: string) => ['calls', id, 'participants'] as const,
    recordings: (id: string) => ['calls', id, 'recordings'] as const,
  },

  // Media/Files
  media: {
    all: (params?: Record<string, unknown>) => ['media', params] as const,
    detail: (id: string) => ['media', id] as const,
    mine: (params?: Record<string, unknown>) => ['media', 'mine', params] as const,
    byConversation: (conversationId: string, params?: Record<string, unknown>) =>
      ['media', 'conversation', conversationId, params] as const,
    stats: ['media', 'stats'] as const,
    search: (query: string, params?: Record<string, unknown>) =>
      ['media', 'search', query, params] as const,
  },

  // Notifications
  notifications: {
    all: (params?: Record<string, unknown>) => ['notifications', params] as const,
    detail: (id: string) => ['notifications', id] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
    preferences: ['notifications', 'preferences'] as const,
    history: (params?: Record<string, unknown>) => ['notifications', 'history', params] as const,
  },

  // Search
  search: {
    global: (query: string, filters?: Record<string, unknown>, params?: Record<string, unknown>) =>
      ['search', query, filters, params] as const,
    messages: (query: string, filters?: Record<string, unknown>, params?: Record<string, unknown>) =>
      ['search', 'messages', query, filters, params] as const,
    users: (query: string, params?: Record<string, unknown>) =>
      ['search', 'users', query, params] as const,
    groups: (query: string, params?: Record<string, unknown>) =>
      ['search', 'groups', query, params] as const,
    channels: (query: string, params?: Record<string, unknown>) =>
      ['search', 'channels', query, params] as const,
    files: (query: string, filters?: Record<string, unknown>, params?: Record<string, unknown>) =>
      ['search', 'files', query, filters, params] as const,
    suggestions: (query: string) => ['search', 'suggestions', query] as const,
    recent: ['search', 'recent'] as const,
    hashtags: (hashtag: string, params?: Record<string, unknown>) =>
      ['search', 'hashtags', hashtag, params] as const,
    trending: (limit?: number) => ['search', 'trending', limit] as const,
  },

  // AI
  ai: {
    smartReplies: (messageId: string, count?: number) =>
      ['ai', 'smart-replies', messageId, count] as const,
    usageStats: ['ai', 'usage-stats'] as const,
  },

  // Webhooks
  webhooks: {
    all: (params?: Record<string, unknown>) => ['webhooks', params] as const,
    detail: (id: string) => ['webhooks', id] as const,
    deliveries: (id: string, params?: Record<string, unknown>) =>
      ['webhooks', id, 'deliveries', params] as const,
    stats: (id: string) => ['webhooks', id, 'stats'] as const,
    events: ['webhooks', 'events'] as const,
    limits: ['webhooks', 'limits'] as const,
  },

  // Presence
  presence: {
    mine: ['presence', 'mine'] as const,
    user: (userId: string) => ['presence', 'user', userId] as const,
    onlineContacts: ['presence', 'online-contacts'] as const,
    settings: ['presence', 'settings'] as const,
    history: (startDate: string, endDate: string) =>
      ['presence', 'history', startDate, endDate] as const,
    sessions: ['presence', 'sessions'] as const,
  },
} as const;

/**
 * Invalidate related queries helper
 * Use this to invalidate queries after mutations
 */
export const invalidateQueries = {
  conversation: async (conversationId: string) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.conversations.detail(conversationId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.messages.all(conversationId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all() });
  },

  message: async (conversationId: string, messageId?: string) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.messages.all(conversationId) });
    if (messageId) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.messages.detail(messageId) });
    }
  },

  group: async (groupId: string) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.groups.members(groupId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.groups.all() });
  },

  channel: async (channelId: string) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.channels.detail(channelId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.channels.members(channelId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.channels.all() });
  },

  notifications: async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
  },

  presence: async (userId?: string) => {
    if (userId) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.presence.user(userId) });
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.presence.onlineContacts });
  },
};
