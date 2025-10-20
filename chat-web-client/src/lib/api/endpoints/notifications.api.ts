/**
 * Notifications API Service
 * Handles notification management and preferences
 */

import { apiClient } from '../client';
import type { PaginationParams } from '@/types/api.types';
import type { Notification, PaginatedResponse } from '@/types/entities.types';

export const notificationsApi = {
  /**
   * Get all notifications for current user
   */
  getAll: async (params?: PaginationParams & { type?: string; isRead?: boolean }): Promise<PaginatedResponse<Notification>> => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  /**
   * Get notification by ID
   */
  getById: async (id: string): Promise<Notification> => {
    const response = await apiClient.get(`/notifications/${id}`);
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  /**
   * Mark notification as unread
   */
  markAsUnread: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/unread`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all');
  },

  /**
   * Delete notification
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },

  /**
   * Delete all notifications
   */
  deleteAll: async (): Promise<void> => {
    await apiClient.delete('/notifications');
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  /**
   * Get notification preferences/settings
   */
  getPreferences: async (): Promise<{
    pushEnabled: boolean;
    emailEnabled: boolean;
    messageNotifications: boolean;
    mentionNotifications: boolean;
    callNotifications: boolean;
    groupNotifications: boolean;
    channelNotifications: boolean;
    storyNotifications: boolean;
    systemNotifications: boolean;
    mutedUntil: string | null;
    doNotDisturb: {
      enabled: boolean;
      startTime: string | null;
      endTime: string | null;
    };
  }> => {
    const response = await apiClient.get('/notifications/preferences');
    return response.data;
  },

  /**
   * Update notification preferences
   */
  updatePreferences: async (preferences: Partial<{
    pushEnabled: boolean;
    emailEnabled: boolean;
    messageNotifications: boolean;
    mentionNotifications: boolean;
    callNotifications: boolean;
    groupNotifications: boolean;
    channelNotifications: boolean;
    storyNotifications: boolean;
    systemNotifications: boolean;
  }>): Promise<void> => {
    await apiClient.patch('/notifications/preferences', preferences);
  },

  /**
   * Enable push notifications
   */
  enablePush: async (deviceToken: string, platform: 'web' | 'ios' | 'android'): Promise<void> => {
    await apiClient.post('/notifications/push/enable', { deviceToken, platform });
  },

  /**
   * Disable push notifications
   */
  disablePush: async (deviceToken?: string): Promise<void> => {
    await apiClient.post('/notifications/push/disable', { deviceToken });
  },

  /**
   * Test notification (send test notification)
   */
  sendTest: async (): Promise<void> => {
    await apiClient.post('/notifications/test');
  },

  /**
   * Mute notifications for duration
   */
  mute: async (durationMinutes: number): Promise<void> => {
    await apiClient.post('/notifications/mute', { durationMinutes });
  },

  /**
   * Unmute notifications
   */
  unmute: async (): Promise<void> => {
    await apiClient.post('/notifications/unmute');
  },

  /**
   * Enable Do Not Disturb mode
   */
  enableDoNotDisturb: async (startTime?: string, endTime?: string): Promise<void> => {
    await apiClient.post('/notifications/dnd/enable', { startTime, endTime });
  },

  /**
   * Disable Do Not Disturb mode
   */
  disableDoNotDisturb: async (): Promise<void> => {
    await apiClient.post('/notifications/dnd/disable');
  },

  /**
   * Get notification history/logs
   */
  getHistory: async (params?: PaginationParams): Promise<PaginatedResponse<Notification>> => {
    const response = await apiClient.get('/notifications/history', { params });
    return response.data;
  },

  /**
   * Clear notification history
   */
  clearHistory: async (): Promise<void> => {
    await apiClient.delete('/notifications/history');
  },
};
