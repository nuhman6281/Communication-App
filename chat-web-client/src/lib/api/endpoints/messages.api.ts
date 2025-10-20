/**
 * Messages API Service
 * Handles message-related API calls
 */

import { apiClient } from '../client';
import { transformPaginatedResponse } from '../utils';
import type { SendMessageRequest, UpdateMessageRequest, AddReactionRequest, PaginationParams } from '@/types/api.types';
import type { Message, MessageReaction, PaginatedResponse } from '@/types/entities.types';

export const messagesApi = {
  /**
   * Get messages for a conversation with pagination
   */
  getByConversation: async (conversationId: string, params?: PaginationParams): Promise<PaginatedResponse<Message>> => {
    const response = await apiClient.get(`/conversations/${conversationId}/messages`, { params });
    return transformPaginatedResponse<Message>(response.data, 'messages');
  },

  /**
   * Get single message by ID
   */
  getById: async (id: string): Promise<Message> => {
    const response = await apiClient.get(`/messages/${id}`);
    return response.data;
  },

  /**
   * Send new message
   */
  send: async (data: SendMessageRequest): Promise<Message> => {
    const response = await apiClient.post('/messages', data);
    // Backend returns the message directly after interceptor extracts data
    return response.data;
  },

  /**
   * Update/edit message
   */
  update: async (id: string, data: UpdateMessageRequest): Promise<Message> => {
    const response = await apiClient.patch(`/messages/${id}`, data);
    return response.data;
  },

  /**
   * Delete message
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/messages/${id}`);
  },

  /**
   * Add reaction to message
   */
  addReaction: async (id: string, data: AddReactionRequest): Promise<MessageReaction> => {
    const response = await apiClient.post(`/messages/${id}/reactions`, data);
    return response.data;
  },

  /**
   * Remove reaction from message
   */
  removeReaction: async (id: string, emoji: string): Promise<void> => {
    await apiClient.delete(`/messages/${id}/reactions/${encodeURIComponent(emoji)}`);
  },

  /**
   * Pin message
   */
  pin: async (id: string): Promise<Message> => {
    const response = await apiClient.post(`/messages/${id}/pin`);
    return response.data;
  },

  /**
   * Unpin message
   */
  unpin: async (id: string): Promise<Message> => {
    const response = await apiClient.delete(`/messages/${id}/pin`);
    return response.data;
  },

  /**
   * Forward message
   */
  forward: async (id: string, conversationIds: string[]): Promise<Message[]> => {
    const response = await apiClient.post(`/messages/${id}/forward`, { conversationIds });
    return response.data;
  },

  /**
   * Get message thread (replies)
   */
  getThread: async (id: string, params?: PaginationParams): Promise<PaginatedResponse<Message>> => {
    const response = await apiClient.get(`/messages/${id}/thread`, { params });
    return transformPaginatedResponse<Message>(response.data, 'messages');
  },

  /**
   * Get pinned messages for a conversation
   */
  getPinned: async (conversationId: string): Promise<any> => {
    const response = await apiClient.get(`/messages/conversations/${conversationId}/pinned`);
    return response.data;
  },
};
