/**
 * Calls API Service
 * Handles video/audio call management with Jitsi integration
 */

import { apiClient } from '../client';
import type { InitiateCallRequest, PaginationParams } from '@/types/api.types';
import type { Call, PaginatedResponse } from '@/types/entities.types';

export const callsApi = {
  /**
   * Initiate new call
   */
  initiate: async (data: InitiateCallRequest): Promise<Call> => {
    const response = await apiClient.post('/calls', data);
    return response.data;
  },

  /**
   * Get call by ID
   */
  getById: async (id: string): Promise<Call> => {
    const response = await apiClient.get(`/calls/${id}`);
    return response.data;
  },

  /**
   * Join call
   */
  join: async (id: string): Promise<{
    call: Call;
    jitsiToken: string;
    jitsiRoomName: string;
    jitsiDomain: string;
  }> => {
    const response = await apiClient.post(`/calls/${id}/join`);
    return response.data;
  },

  /**
   * Leave call
   */
  leave: async (id: string): Promise<void> => {
    await apiClient.post(`/calls/${id}/leave`);
  },

  /**
   * End call (only host/admin)
   */
  end: async (id: string): Promise<void> => {
    await apiClient.post(`/calls/${id}/end`);
  },

  /**
   * Get call participants
   */
  getParticipants: async (id: string): Promise<Array<{
    userId: string;
    username: string;
    avatarUrl: string | null;
    joinedAt: string;
    leftAt: string | null;
    isMuted: boolean;
    isVideoEnabled: boolean;
  }>> => {
    const response = await apiClient.get(`/calls/${id}/participants`);
    return response.data;
  },

  /**
   * Invite user to call
   */
  invite: async (id: string, userIds: string[]): Promise<void> => {
    await apiClient.post(`/calls/${id}/invite`, { userIds });
  },

  /**
   * Mute participant (admin only)
   */
  muteParticipant: async (id: string, userId: string): Promise<void> => {
    await apiClient.post(`/calls/${id}/participants/${userId}/mute`);
  },

  /**
   * Remove participant from call (admin only)
   */
  removeParticipant: async (id: string, userId: string): Promise<void> => {
    await apiClient.delete(`/calls/${id}/participants/${userId}`);
  },

  /**
   * Start call recording
   */
  startRecording: async (id: string): Promise<{ recordingId: string }> => {
    const response = await apiClient.post(`/calls/${id}/recording/start`);
    return response.data;
  },

  /**
   * Stop call recording
   */
  stopRecording: async (id: string): Promise<{
    recordingUrl: string;
    duration: number;
    size: number;
  }> => {
    const response = await apiClient.post(`/calls/${id}/recording/stop`);
    return response.data;
  },

  /**
   * Get call recordings
   */
  getRecordings: async (id: string): Promise<Array<{
    id: string;
    url: string;
    duration: number;
    size: number;
    createdAt: string;
  }>> => {
    const response = await apiClient.get(`/calls/${id}/recordings`);
    return response.data;
  },

  /**
   * Get call history
   */
  getHistory: async (params?: PaginationParams): Promise<PaginatedResponse<Call>> => {
    const response = await apiClient.get('/calls/history', { params });
    return response.data;
  },

  /**
   * Get active calls
   */
  getActive: async (): Promise<Call[]> => {
    const response = await apiClient.get('/calls/active');
    return response.data;
  },

  /**
   * Get missed calls
   */
  getMissed: async (params?: PaginationParams): Promise<PaginatedResponse<Call>> => {
    const response = await apiClient.get('/calls/missed', { params });
    return response.data;
  },

  /**
   * Mark call as answered (clears missed call notification)
   */
  markAsAnswered: async (id: string): Promise<void> => {
    await apiClient.post(`/calls/${id}/answered`);
  },

  /**
   * Get call analytics/statistics
   */
  getStats: async (id: string): Promise<{
    duration: number;
    participantCount: number;
    peakParticipants: number;
    recordingDuration: number;
    qualityScore: number;
    averageBitrate: number;
  }> => {
    const response = await apiClient.get(`/calls/${id}/stats`);
    return response.data;
  },

  /**
   * Enable screen sharing
   */
  enableScreenShare: async (id: string): Promise<void> => {
    await apiClient.post(`/calls/${id}/screen-share/enable`);
  },

  /**
   * Disable screen sharing
   */
  disableScreenShare: async (id: string): Promise<void> => {
    await apiClient.post(`/calls/${id}/screen-share/disable`);
  },

  /**
   * Reject incoming call
   */
  reject: async (id: string): Promise<void> => {
    await apiClient.post(`/calls/${id}/reject`);
  },
};
