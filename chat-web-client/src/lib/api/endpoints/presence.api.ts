/**
 * Presence API Service
 * Handles user presence, online status, and typing indicators
 */

import { apiClient } from '../client';
import type { PresenceStatus } from '@/types/entities.types';

export const presenceApi = {
  /**
   * Get current user's presence status
   */
  getMyPresence: async (): Promise<{
    status: PresenceStatus;
    customStatus: string | null;
    lastSeenAt: string | null;
    isOnline: boolean;
  }> => {
    const response = await apiClient.get('/presence/me');
    return response.data;
  },

  /**
   * Update current user's presence status
   */
  updatePresence: async (
    status: PresenceStatus,
    customStatus?: string
  ): Promise<{
    status: PresenceStatus;
    customStatus: string | null;
  }> => {
    const response = await apiClient.patch('/presence/me', {
      status,
      customStatus,
    });
    return response.data;
  },

  /**
   * Get presence for specific user
   */
  getUserPresence: async (userId: string): Promise<{
    userId: string;
    status: PresenceStatus;
    customStatus: string | null;
    lastSeenAt: string | null;
    isOnline: boolean;
  }> => {
    const response = await apiClient.get(`/presence/users/${userId}`);
    return response.data;
  },

  /**
   * Get presence for multiple users (batch)
   */
  getBatchPresence: async (userIds: string[]): Promise<Array<{
    userId: string;
    status: PresenceStatus;
    customStatus: string | null;
    lastSeenAt: string | null;
    isOnline: boolean;
  }>> => {
    const response = await apiClient.post('/presence/batch', { userIds });
    return response.data;
  },

  /**
   * Set typing indicator in conversation
   */
  setTyping: async (conversationId: string, isTyping: boolean): Promise<void> => {
    await apiClient.post(`/presence/typing/${conversationId}`, { isTyping });
  },

  /**
   * Get who is typing in conversation
   */
  getTypingUsers: async (conversationId: string): Promise<Array<{
    userId: string;
    username: string;
    avatarUrl: string | null;
    startedTypingAt: string;
  }>> => {
    const response = await apiClient.get(`/presence/typing/${conversationId}`);
    return response.data;
  },

  /**
   * Set user as online
   */
  setOnline: async (): Promise<void> => {
    await apiClient.post('/presence/online');
  },

  /**
   * Set user as offline
   */
  setOffline: async (): Promise<void> => {
    await apiClient.post('/presence/offline');
  },

  /**
   * Set user as away (auto after inactivity)
   */
  setAway: async (): Promise<void> => {
    await apiClient.post('/presence/away');
  },

  /**
   * Heartbeat to maintain online status
   */
  heartbeat: async (): Promise<{
    acknowledged: boolean;
    nextHeartbeat: number;
  }> => {
    const response = await apiClient.post('/presence/heartbeat');
    return response.data;
  },

  /**
   * Get online contacts
   */
  getOnlineContacts: async (): Promise<Array<{
    userId: string;
    username: string;
    avatarUrl: string | null;
    status: PresenceStatus;
    customStatus: string | null;
  }>> => {
    const response = await apiClient.get('/presence/online-contacts');
    return response.data;
  },

  /**
   * Subscribe to user presence updates (establishes presence channel)
   */
  subscribe: async (userIds: string[]): Promise<{ subscribed: boolean }> => {
    const response = await apiClient.post('/presence/subscribe', { userIds });
    return response.data;
  },

  /**
   * Unsubscribe from user presence updates
   */
  unsubscribe: async (userIds: string[]): Promise<{ unsubscribed: boolean }> => {
    const response = await apiClient.post('/presence/unsubscribe', { userIds });
    return response.data;
  },

  /**
   * Get presence settings
   */
  getSettings: async (): Promise<{
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    showTypingIndicator: boolean;
    autoAwayMinutes: number;
  }> => {
    const response = await apiClient.get('/presence/settings');
    return response.data;
  },

  /**
   * Update presence settings
   */
  updateSettings: async (settings: {
    showOnlineStatus?: boolean;
    showLastSeen?: boolean;
    showTypingIndicator?: boolean;
    autoAwayMinutes?: number;
  }): Promise<void> => {
    await apiClient.patch('/presence/settings', settings);
  },

  /**
   * Get presence history for analytics
   */
  getHistory: async (
    startDate: string,
    endDate: string
  ): Promise<Array<{
    date: string;
    onlineMinutes: number;
    awayMinutes: number;
    offlineMinutes: number;
    sessions: number;
  }>> => {
    const response = await apiClient.get('/presence/history', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  /**
   * Get current active sessions
   */
  getActiveSessions: async (): Promise<Array<{
    id: string;
    device: string;
    platform: string;
    browser: string | null;
    ipAddress: string;
    location: string | null;
    lastActiveAt: string;
    createdAt: string;
  }>> => {
    const response = await apiClient.get('/presence/sessions');
    return response.data;
  },

  /**
   * Terminate specific session
   */
  terminateSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/presence/sessions/${sessionId}`);
  },

  /**
   * Terminate all other sessions (except current)
   */
  terminateOtherSessions: async (): Promise<{ terminated: number }> => {
    const response = await apiClient.post('/presence/sessions/terminate-others');
    return response.data;
  },
};
