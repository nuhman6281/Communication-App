/**
 * Stories Hooks
 * TanStack Query hooks for managing Instagram-style stories
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storiesApi } from '@/lib/api/endpoints/stories.api';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';
import type { CreateStoryRequest, PaginationParams } from '@/types/api.types';

/**
 * Get all active stories from contacts
 */
export function useActiveStories() {
  return useQuery({
    queryKey: queryKeys.stories.active,
    queryFn: () => storiesApi.getActiveStories(),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
    retry: 1, // Only retry once on failure
    onError: (error: any) => {
      console.error('[Stories] Failed to fetch active stories:', error);
      // Silent fail - don't show toast for background queries
    },
  });
}

/**
 * Get user's own stories
 */
export function useMyStories() {
  return useQuery({
    queryKey: queryKeys.stories.mine,
    queryFn: () => storiesApi.getMyStories(),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Get stories by specific user
 */
export function useUserStories(userId: string) {
  return useQuery({
    queryKey: queryKeys.stories.byUser(userId),
    queryFn: () => storiesApi.getByUser(userId),
    enabled: !!userId,
    staleTime: 60000,
  });
}

/**
 * Get story by ID
 */
export function useStory(storyId: string) {
  return useQuery({
    queryKey: queryKeys.stories.detail(storyId),
    queryFn: () => storiesApi.getById(storyId),
    enabled: !!storyId,
  });
}

/**
 * Get story viewers
 */
export function useStoryViews(storyId: string, params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.stories.views(storyId),
    queryFn: () => storiesApi.getViews(storyId, params),
    enabled: !!storyId,
  });
}

/**
 * Create new story
 */
export function useCreateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStoryRequest) => storiesApi.create(data),
    onSuccess: () => {
      // Invalidate stories queries
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.active });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.mine });
      toast.success('Story created successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create story');
    },
  });
}

/**
 * Upload story with media file
 */
export function useUploadStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      caption,
      privacy,
    }: {
      file: File;
      caption?: string;
      privacy?: 'public' | 'friends' | 'private';
    }) => storiesApi.uploadStory(file, caption, privacy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.active });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.mine });
      toast.success('Story uploaded successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message
        || error?.message
        || 'Failed to upload story';
      toast.error(String(errorMessage));
    },
  });
}

/**
 * Delete story
 */
export function useDeleteStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storyId: string) => storiesApi.delete(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.active });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.mine });
      toast.success('Story deleted');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete story');
    },
  });
}

/**
 * View story (mark as viewed)
 */
export function useViewStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storyId: string) => storiesApi.view(storyId),
    onSuccess: (_, storyId) => {
      // Update story views count
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.views(storyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.active });
    },
    onError: () => {
      // Silent fail for view tracking
      console.error('Failed to track story view');
    },
  });
}

/**
 * React to story
 */
export function useReactToStory() {
  return useMutation({
    mutationFn: ({ storyId, reaction }: { storyId: string; reaction: string }) =>
      storiesApi.react(storyId, reaction),
    onSuccess: () => {
      toast.success('Reaction sent!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to send reaction');
    },
  });
}

/**
 * Reply to story
 */
export function useReplyToStory() {
  return useMutation({
    mutationFn: ({ storyId, message }: { storyId: string; message: string }) =>
      storiesApi.reply(storyId, message),
    onSuccess: () => {
      toast.success('Reply sent!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to send reply');
    },
  });
}

/**
 * Get archived stories
 */
export function useArchivedStories(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.stories.archived,
    queryFn: () => storiesApi.getArchived(params),
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Archive story
 */
export function useArchiveStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storyId: string) => storiesApi.archive(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.archived });
      toast.success('Story archived');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to archive story');
    },
  });
}

/**
 * Get user's story highlights
 */
export function useStoryHighlights(userId?: string) {
  return useQuery({
    queryKey: userId ? queryKeys.stories.highlights(userId) : queryKeys.stories.myHighlights,
    queryFn: () => storiesApi.getHighlights(userId),
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Create story highlight
 */
export function useCreateHighlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, storyIds }: { name: string; storyIds: string[] }) =>
      storiesApi.createHighlight(name, storyIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.myHighlights });
      toast.success('Highlight created!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create highlight');
    },
  });
}

/**
 * Update story privacy
 */
export function useUpdateStoryPrivacy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      storyId,
      privacy,
    }: {
      storyId: string;
      privacy: 'public' | 'friends' | 'private';
    }) => storiesApi.updatePrivacy(storyId, privacy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.mine });
      toast.success('Privacy updated');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update privacy');
    },
  });
}

/**
 * Get story statistics
 */
export function useStoryStats(storyId: string) {
  return useQuery({
    queryKey: queryKeys.stories.stats(storyId),
    queryFn: () => storiesApi.getStats(storyId),
    enabled: !!storyId,
    staleTime: 60000,
  });
}
