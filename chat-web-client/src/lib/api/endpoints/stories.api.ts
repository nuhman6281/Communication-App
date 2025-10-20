/**
 * Stories API Service
 * Handles Instagram-style 24-hour disappearing stories
 */

import { apiClient } from '../client';
import type { CreateStoryRequest, PaginationParams } from '@/types/api.types';
import type { Story, StoryView, PaginatedResponse } from '@/types/entities.types';

export const storiesApi = {
  /**
   * Get all stories (user's feed)
   */
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Story>> => {
    const response = await apiClient.get('/stories', { params });
    return response.data;
  },

  /**
   * Get story by ID
   */
  getById: async (id: string): Promise<Story> => {
    const response = await apiClient.get(`/stories/${id}`);
    return response.data;
  },

  /**
   * Create new story
   */
  create: async (data: CreateStoryRequest): Promise<Story> => {
    const response = await apiClient.post('/stories', data);
    return response.data;
  },

  /**
   * Upload story with media file
   */
  uploadStory: async (
    file: File,
    caption?: string,
    privacy?: 'public' | 'friends' | 'private'
  ): Promise<Story> => {
    const formData = new FormData();
    formData.append('media', file);
    if (caption) formData.append('caption', caption);
    if (privacy) formData.append('privacy', privacy);

    const response = await apiClient.post('/stories/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  /**
   * Delete story
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/stories/${id}`);
  },

  /**
   * Get user's own stories
   */
  getMyStories: async (): Promise<Story[]> => {
    const response = await apiClient.get('/stories/me');
    return response.data;
  },

  /**
   * Get stories by user ID
   */
  getByUser: async (userId: string): Promise<Story[]> => {
    const response = await apiClient.get(`/stories/user/${userId}`);
    return response.data;
  },

  /**
   * View story (marks as viewed)
   */
  view: async (id: string): Promise<StoryView> => {
    const response = await apiClient.post(`/stories/${id}/view`);
    return response.data;
  },

  /**
   * Get story views/viewers
   */
  getViews: async (id: string, params?: PaginationParams): Promise<PaginatedResponse<StoryView>> => {
    const response = await apiClient.get(`/stories/${id}/views`, { params });
    return response.data;
  },

  /**
   * React to story
   */
  react: async (id: string, reaction: string): Promise<void> => {
    await apiClient.post(`/stories/${id}/react`, { reaction });
  },

  /**
   * Reply to story (sends as DM)
   */
  reply: async (id: string, message: string): Promise<void> => {
    await apiClient.post(`/stories/${id}/reply`, { message });
  },

  /**
   * Get active stories from contacts
   */
  getActiveStories: async (): Promise<Array<{
    userId: string;
    username: string;
    avatarUrl: string | null;
    stories: Story[];
    latestStoryAt: string;
    unseenCount: number;
  }>> => {
    const response = await apiClient.get('/stories/active');
    return response.data;
  },

  /**
   * Get archived stories (expired but saved)
   */
  getArchived: async (params?: PaginationParams): Promise<PaginatedResponse<Story>> => {
    const response = await apiClient.get('/stories/archived', { params });
    return response.data;
  },

  /**
   * Archive story (save after expiration)
   */
  archive: async (id: string): Promise<void> => {
    await apiClient.post(`/stories/${id}/archive`);
  },

  /**
   * Unarchive story
   */
  unarchive: async (id: string): Promise<void> => {
    await apiClient.delete(`/stories/${id}/archive`);
  },

  /**
   * Update story privacy
   */
  updatePrivacy: async (
    id: string,
    privacy: 'public' | 'friends' | 'private'
  ): Promise<Story> => {
    const response = await apiClient.patch(`/stories/${id}/privacy`, { privacy });
    return response.data;
  },

  /**
   * Get story analytics/statistics
   */
  getStats: async (id: string): Promise<{
    viewCount: number;
    reactionCount: number;
    replyCount: number;
    shareCount: number;
    topViewers: Array<{ userId: string; username: string; viewCount: number }>;
  }> => {
    const response = await apiClient.get(`/stories/${id}/stats`);
    return response.data;
  },

  /**
   * Highlight story (add to profile highlights)
   */
  addToHighlight: async (storyId: string, highlightId: string): Promise<void> => {
    await apiClient.post(`/stories/${storyId}/highlight`, { highlightId });
  },

  /**
   * Create story highlight
   */
  createHighlight: async (name: string, storyIds: string[]): Promise<{
    id: string;
    name: string;
    coverImage: string;
    stories: Story[];
  }> => {
    const response = await apiClient.post('/stories/highlights', { name, storyIds });
    return response.data;
  },

  /**
   * Get user's story highlights
   */
  getHighlights: async (userId?: string): Promise<Array<{
    id: string;
    name: string;
    coverImage: string;
    storyCount: number;
  }>> => {
    const response = await apiClient.get('/stories/highlights', {
      params: userId ? { userId } : undefined,
    });
    return response.data;
  },
};
