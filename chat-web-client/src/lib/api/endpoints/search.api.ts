/**
 * Search API Service
 * Handles global search across messages, users, groups, channels, files
 */

import { apiClient } from '../client';
import type { PaginationParams } from '@/types/api.types';
import type { Message, User, Group, Channel, MediaFile, PaginatedResponse } from '@/types/entities.types';

export interface SearchFilters {
  type?: 'all' | 'messages' | 'users' | 'groups' | 'channels' | 'files';
  conversationId?: string;
  senderId?: string;
  dateFrom?: string;
  dateTo?: string;
  hasAttachments?: boolean;
  mediaType?: string;
}

export interface SearchResults {
  messages: PaginatedResponse<Message>;
  users: PaginatedResponse<User>;
  groups: PaginatedResponse<Group>;
  channels: PaginatedResponse<Channel>;
  files: PaginatedResponse<MediaFile>;
  totalResults: number;
}

export const searchApi = {
  /**
   * Global search across all types
   */
  search: async (
    query: string,
    filters?: SearchFilters,
    params?: PaginationParams
  ): Promise<SearchResults> => {
    const response = await apiClient.get('/search', {
      params: { q: query, ...filters, ...params },
    });
    return response.data;
  },

  /**
   * Search messages only
   */
  searchMessages: async (
    query: string,
    filters?: Omit<SearchFilters, 'type'>,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Message>> => {
    const response = await apiClient.get('/search/messages', {
      params: { q: query, ...filters, ...params },
    });
    return response.data;
  },

  /**
   * Search users only
   */
  searchUsers: async (
    query: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/search/users', {
      params: { q: query, ...params },
    });
    return response.data;
  },

  /**
   * Search groups only
   */
  searchGroups: async (
    query: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Group>> => {
    const response = await apiClient.get('/search/groups', {
      params: { q: query, ...params },
    });
    return response.data;
  },

  /**
   * Search channels only
   */
  searchChannels: async (
    query: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Channel>> => {
    const response = await apiClient.get('/search/channels', {
      params: { q: query, ...params },
    });
    return response.data;
  },

  /**
   * Search files only
   */
  searchFiles: async (
    query: string,
    filters?: { mediaType?: string; conversationId?: string },
    params?: PaginationParams
  ): Promise<PaginatedResponse<MediaFile>> => {
    const response = await apiClient.get('/search/files', {
      params: { q: query, ...filters, ...params },
    });
    return response.data;
  },

  /**
   * Get search suggestions/autocomplete
   */
  getSuggestions: async (query: string): Promise<{
    users: User[];
    groups: Group[];
    channels: Channel[];
    hashtags: string[];
    recent: string[];
  }> => {
    const response = await apiClient.get('/search/suggestions', {
      params: { q: query },
    });
    return response.data;
  },

  /**
   * Get recent searches
   */
  getRecentSearches: async (): Promise<Array<{
    id: string;
    query: string;
    type: string;
    timestamp: string;
  }>> => {
    const response = await apiClient.get('/search/recent');
    return response.data;
  },

  /**
   * Save search query to history
   */
  saveSearch: async (query: string, type: string): Promise<void> => {
    await apiClient.post('/search/save', { query, type });
  },

  /**
   * Clear search history
   */
  clearHistory: async (): Promise<void> => {
    await apiClient.delete('/search/history');
  },

  /**
   * Delete specific search from history
   */
  deleteSearch: async (id: string): Promise<void> => {
    await apiClient.delete(`/search/history/${id}`);
  },

  /**
   * Search by hashtag
   */
  searchByHashtag: async (
    hashtag: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Message>> => {
    const response = await apiClient.get('/search/hashtags', {
      params: { hashtag, ...params },
    });
    return response.data;
  },

  /**
   * Get trending hashtags
   */
  getTrendingHashtags: async (limit?: number): Promise<Array<{
    hashtag: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>> => {
    const response = await apiClient.get('/search/trending', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Advanced search with complex filters
   */
  advancedSearch: async (params: {
    query: string;
    type?: string;
    conversationId?: string;
    senderId?: string;
    dateFrom?: string;
    dateTo?: string;
    hasAttachments?: boolean;
    mediaType?: string;
    messageType?: string;
    isPinned?: boolean;
    hasReactions?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'relevance' | 'date' | 'sender';
    sortOrder?: 'asc' | 'desc';
  }): Promise<SearchResults> => {
    const response = await apiClient.post('/search/advanced', params);
    return response.data;
  },
};
