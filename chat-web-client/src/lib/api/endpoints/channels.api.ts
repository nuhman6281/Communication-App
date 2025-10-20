/**
 * Channels API Service
 * Handles channel/broadcast-related API calls
 */

import { apiClient } from '../client';
import type {
  CreateChannelRequest,
  UpdateChannelRequest,
  PaginationParams,
} from '@/types/api.types';
import type { Channel, ChannelMember, PaginatedResponse } from '@/types/entities.types';

export const channelsApi = {
  /**
   * Get all channels for current user
   */
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Channel>> => {
    const response = await apiClient.get('/channels', { params });
    return response.data;
  },

  /**
   * Get channel by ID
   */
  getById: async (id: string): Promise<Channel> => {
    const response = await apiClient.get(`/channels/${id}`);
    return response.data;
  },

  /**
   * Create new channel
   */
  create: async (data: CreateChannelRequest): Promise<Channel> => {
    const response = await apiClient.post('/channels', data);
    return response.data;
  },

  /**
   * Update channel
   */
  update: async (id: string, data: UpdateChannelRequest): Promise<Channel> => {
    const response = await apiClient.patch(`/channels/${id}`, data);
    return response.data;
  },

  /**
   * Delete channel
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/channels/${id}`);
  },

  /**
   * Subscribe to channel
   */
  subscribe: async (id: string): Promise<Channel> => {
    const response = await apiClient.post(`/channels/${id}/subscribe`);
    return response.data;
  },

  /**
   * Unsubscribe from channel
   */
  unsubscribe: async (id: string): Promise<void> => {
    await apiClient.post(`/channels/${id}/unsubscribe`);
  },

  /**
   * Get channel members/subscribers
   */
  getMembers: async (id: string, params?: PaginationParams): Promise<PaginatedResponse<ChannelMember>> => {
    const response = await apiClient.get(`/channels/${id}/members`, { params });
    return response.data;
  },

  /**
   * Add admins to channel
   */
  addAdmins: async (id: string, userIds: string[]): Promise<Channel> => {
    const response = await apiClient.post(`/channels/${id}/admins`, { userIds });
    return response.data;
  },

  /**
   * Remove admin from channel
   */
  removeAdmin: async (id: string, userId: string): Promise<void> => {
    await apiClient.delete(`/channels/${id}/admins/${userId}`);
  },

  /**
   * Ban user from channel
   */
  banUser: async (id: string, userId: string, reason?: string): Promise<void> => {
    await apiClient.post(`/channels/${id}/ban`, { userId, reason });
  },

  /**
   * Unban user from channel
   */
  unbanUser: async (id: string, userId: string): Promise<void> => {
    await apiClient.delete(`/channels/${id}/ban/${userId}`);
  },

  /**
   * Get banned users
   */
  getBannedUsers: async (id: string, params?: PaginationParams): Promise<PaginatedResponse<ChannelMember>> => {
    const response = await apiClient.get(`/channels/${id}/banned`, { params });
    return response.data;
  },

  /**
   * Update channel avatar
   */
  updateAvatar: async (id: string, file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post(`/channels/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Mute channel notifications
   */
  mute: async (id: string, duration?: number): Promise<void> => {
    await apiClient.post(`/channels/${id}/mute`, { duration });
  },

  /**
   * Unmute channel notifications
   */
  unmute: async (id: string): Promise<void> => {
    await apiClient.post(`/channels/${id}/unmute`);
  },

  /**
   * Search public channels
   */
  searchPublic: async (query: string, params?: PaginationParams): Promise<PaginatedResponse<Channel>> => {
    const response = await apiClient.get('/channels/search', { params: { q: query, ...params } });
    return response.data;
  },
};
