/**
 * Groups API Service
 * Handles group-related API calls
 */

import { apiClient } from '../client';
import type {
  CreateGroupRequest,
  UpdateGroupRequest,
  UpdateGroupMemberRoleRequest,
  PaginationParams,
} from '@/types/api.types';
import type { Group, GroupMember, PaginatedResponse } from '@/types/entities.types';

export const groupsApi = {
  /**
   * Get all groups for current user
   */
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Group>> => {
    const response = await apiClient.get('/groups', { params });
    return response.data;
  },

  /**
   * Get group by ID
   */
  getById: async (id: string): Promise<Group> => {
    const response = await apiClient.get(`/groups/${id}`);
    return response.data;
  },

  /**
   * Create new group
   */
  create: async (data: CreateGroupRequest): Promise<Group> => {
    const response = await apiClient.post('/groups', data);
    return response.data;
  },

  /**
   * Update group
   */
  update: async (id: string, data: UpdateGroupRequest): Promise<Group> => {
    const response = await apiClient.patch(`/groups/${id}`, data);
    return response.data;
  },

  /**
   * Delete group
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/groups/${id}`);
  },

  /**
   * Leave group
   */
  leave: async (id: string): Promise<void> => {
    await apiClient.post(`/groups/${id}/leave`);
  },

  /**
   * Get group members
   */
  getMembers: async (id: string, params?: PaginationParams): Promise<PaginatedResponse<GroupMember>> => {
    const response = await apiClient.get(`/groups/${id}/members`, { params });
    return response.data;
  },

  /**
   * Add members to group
   */
  addMembers: async (id: string, userIds: string[]): Promise<Group> => {
    const response = await apiClient.post(`/groups/${id}/members`, { userIds });
    return response.data;
  },

  /**
   * Remove member from group
   */
  removeMember: async (id: string, userId: string): Promise<void> => {
    await apiClient.delete(`/groups/${id}/members/${userId}`);
  },

  /**
   * Update member role
   */
  updateMemberRole: async (id: string, userId: string, data: UpdateGroupMemberRoleRequest): Promise<GroupMember> => {
    const response = await apiClient.patch(`/groups/${id}/members/${userId}`, data);
    return response.data;
  },

  /**
   * Update group avatar
   */
  updateAvatar: async (id: string, file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post(`/groups/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Get group settings
   */
  getSettings: async (id: string): Promise<Record<string, unknown>> => {
    const response = await apiClient.get(`/groups/${id}/settings`);
    return response.data;
  },

  /**
   * Update group settings
   */
  updateSettings: async (id: string, settings: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const response = await apiClient.patch(`/groups/${id}/settings`, settings);
    return response.data;
  },

  /**
   * Promote member to admin
   */
  promoteToAdmin: async (id: string, userId: string): Promise<GroupMember> => {
    const response = await apiClient.post(`/groups/${id}/members/${userId}/promote`);
    return response.data;
  },

  /**
   * Demote admin to member
   */
  demoteFromAdmin: async (id: string, userId: string): Promise<GroupMember> => {
    const response = await apiClient.post(`/groups/${id}/members/${userId}/demote`);
    return response.data;
  },

  /**
   * Mute group notifications
   */
  mute: async (id: string, duration?: number): Promise<void> => {
    await apiClient.post(`/groups/${id}/mute`, { duration });
  },

  /**
   * Unmute group notifications
   */
  unmute: async (id: string): Promise<void> => {
    await apiClient.post(`/groups/${id}/unmute`);
  },
};
