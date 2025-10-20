/**
 * Users API Service
 */

import { apiClient } from '../client';
import { transformPaginatedResponse } from '../utils';
import type { User, PaginatedResponse } from '@/types/entities.types';
import type { PaginationParams } from '@/types/api.types';

export const usersApi = {
  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.patch('/users/me', data);
    return response.data;
  },

  updateAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  searchUsers: async (params: { query?: string } & PaginationParams): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/users/search', { params });
    return transformPaginatedResponse<User>(response.data, 'users');
  },

  blockUser: async (userId: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/block`);
  },

  unblockUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/block`);
  },

  getBlockedUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/users/me/blocked');
    return response.data;
  },
};
