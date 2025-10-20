/**
 * Media API Service
 * Handles file upload and media management
 */

import { apiClient } from '../client';
import type { UploadProgressCallback, PaginationParams } from '@/types/api.types';
import type { MediaFile, PaginatedResponse } from '@/types/entities.types';

export const mediaApi = {
  /**
   * Upload single file
   */
  upload: async (
    file: File,
    onProgress?: UploadProgressCallback
  ): Promise<MediaFile> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted, progressEvent.loaded, progressEvent.total);
        }
      },
    });

    return response.data;
  },

  /**
   * Upload multiple files
   */
  uploadMultiple: async (
    files: File[],
    onProgress?: UploadProgressCallback
  ): Promise<MediaFile[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await apiClient.post('/media/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted, progressEvent.loaded, progressEvent.total);
        }
      },
    });

    return response.data;
  },

  /**
   * Get file by ID
   */
  getById: async (id: string): Promise<MediaFile> => {
    const response = await apiClient.get(`/media/${id}`);
    return response.data;
  },

  /**
   * Delete file
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/media/${id}`);
  },

  /**
   * Get user's uploaded files
   */
  getMyFiles: async (params?: PaginationParams): Promise<PaginatedResponse<MediaFile>> => {
    const response = await apiClient.get('/media/me', { params });
    return response.data;
  },

  /**
   * Get files by conversation
   */
  getByConversation: async (
    conversationId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<MediaFile>> => {
    const response = await apiClient.get(`/media/conversation/${conversationId}`, { params });
    return response.data;
  },

  /**
   * Get file download URL
   */
  getDownloadUrl: async (id: string): Promise<{ url: string; expiresAt: string }> => {
    const response = await apiClient.get(`/media/${id}/download-url`);
    return response.data;
  },

  /**
   * Generate thumbnail for image/video
   */
  generateThumbnail: async (id: string): Promise<{ thumbnailUrl: string }> => {
    const response = await apiClient.post(`/media/${id}/thumbnail`);
    return response.data;
  },

  /**
   * Upload avatar/profile picture
   */
  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post('/media/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  /**
   * Upload group/channel cover image
   */
  uploadCoverImage: async (file: File): Promise<{ coverUrl: string }> => {
    const formData = new FormData();
    formData.append('cover', file);

    const response = await apiClient.post('/media/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  /**
   * Get media statistics (storage used, file counts, etc.)
   */
  getStats: async (): Promise<{
    totalFiles: number;
    totalSize: number;
    storageUsed: number;
    storageLimit: number;
    filesByType: Record<string, number>;
  }> => {
    const response = await apiClient.get('/media/stats');
    return response.data;
  },

  /**
   * Search media files
   */
  search: async (
    query: string,
    params?: PaginationParams & { type?: string }
  ): Promise<PaginatedResponse<MediaFile>> => {
    const response = await apiClient.get('/media/search', { params: { q: query, ...params } });
    return response.data;
  },
};
