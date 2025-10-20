/**
 * Conversations API Service
 * Handles conversation-related API calls
 */

import { apiClient } from '../client';
import { transformPaginatedResponse } from '../utils';
import type { CreateConversationRequest, UpdateConversationRequest, PaginationParams } from '@/types/api.types';
import type { Conversation, PaginatedResponse } from '@/types/entities.types';

export const conversationsApi = {
  /**
   * Get all conversations for current user
   */
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Conversation>> => {
    const response = await apiClient.get('/conversations', { params });
    return transformPaginatedResponse<Conversation>(response.data, 'conversations');
  },

  /**
   * Get conversation by ID
   */
  getById: async (id: string): Promise<Conversation> => {
    const response = await apiClient.get(`/conversations/${id}`);
    return response.data;
  },

  /**
   * Get or create self-conversation (for personal notes/bookmarks)
   */
  getSelf: async (): Promise<Conversation> => {
    const response = await apiClient.get('/conversations/self');
    return response.data;
  },

  /**
   * Create new conversation
   */
  create: async (data: CreateConversationRequest): Promise<Conversation> => {
    const response = await apiClient.post('/conversations', data);
    return response.data;
  },

  /**
   * Update conversation
   */
  update: async (id: string, data: UpdateConversationRequest): Promise<Conversation> => {
    const response = await apiClient.patch(`/conversations/${id}`, data);
    return response.data;
  },

  /**
   * Delete conversation
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/conversations/${id}`);
  },

  /**
   * Leave conversation
   */
  leave: async (id: string): Promise<void> => {
    await apiClient.post(`/conversations/${id}/leave`);
  },

  /**
   * Mark conversation as read
   */
  markAsRead: async (id: string): Promise<void> => {
    await apiClient.post(`/conversations/${id}/read`);
  },

  /**
   * Add participants to conversation
   */
  addParticipants: async (id: string, userIds: string[]): Promise<Conversation> => {
    const response = await apiClient.post(`/conversations/${id}/participants`, { userIds });
    return response.data;
  },

  /**
   * Remove participant from conversation
   */
  removeParticipant: async (id: string, userId: string): Promise<void> => {
    await apiClient.delete(`/conversations/${id}/participants/${userId}`);
  },
};
