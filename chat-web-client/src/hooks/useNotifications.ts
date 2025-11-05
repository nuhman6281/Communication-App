/**
 * Notifications Hooks
 * TanStack Query hooks for managing notifications
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/endpoints/notifications.api';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';
import type { PaginationParams } from '@/types/api.types';

/**
 * Get all notifications
 */
export function useNotifications(params?: PaginationParams & { type?: string; isRead?: boolean }) {
  return useQuery({
    queryKey: queryKeys.notifications.all(params),
    queryFn: () => notificationsApi.getAll(params),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Get notification by ID
 */
export function useNotification(id: string) {
  return useQuery({
    queryKey: queryKeys.notifications.detail(id),
    queryFn: () => notificationsApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Get unread notification count
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () => notificationsApi.getUnreadCount(),
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Mark notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: (_, id) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
    onError: (error: any) => {
      console.error('Failed to mark notification as read:', error);
    },
  });
}

/**
 * Mark notification as unread
 */
export function useMarkNotificationAsUnread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsUnread(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to mark as unread');
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
      toast.success('All notifications marked as read');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to mark all as read');
    },
  });
}

/**
 * Delete notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
      toast.success('Notification deleted');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete notification');
    },
  });
}

/**
 * Delete all notifications
 */
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
      toast.success('All notifications deleted');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete all notifications');
    },
  });
}

/**
 * Get notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: queryKeys.notifications.preferences,
    queryFn: () => notificationsApi.getPreferences(),
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: Parameters<typeof notificationsApi.updatePreferences>[0]) =>
      notificationsApi.updatePreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.preferences });
      toast.success('Notification preferences updated');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update preferences');
    },
  });
}

/**
 * Enable push notifications
 */
export function useEnablePushNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deviceToken, platform }: { deviceToken: string; platform: 'web' | 'ios' | 'android' }) =>
      notificationsApi.enablePush(deviceToken, platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.preferences });
      toast.success('Push notifications enabled');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to enable push notifications');
    },
  });
}

/**
 * Disable push notifications
 */
export function useDisablePushNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceToken?: string) => notificationsApi.disablePush(deviceToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.preferences });
      toast.success('Push notifications disabled');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to disable push notifications');
    },
  });
}

/**
 * Send test notification
 */
export function useSendTestNotification() {
  return useMutation({
    mutationFn: () => notificationsApi.sendTest(),
    onSuccess: () => {
      toast.success('Test notification sent!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to send test notification');
    },
  });
}

/**
 * Mute notifications for duration
 */
export function useMuteNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (durationMinutes: number) => notificationsApi.mute(durationMinutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.preferences });
      toast.success('Notifications muted');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to mute notifications');
    },
  });
}

/**
 * Unmute notifications
 */
export function useUnmuteNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.unmute(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.preferences });
      toast.success('Notifications unmuted');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to unmute notifications');
    },
  });
}

/**
 * Enable Do Not Disturb mode
 */
export function useEnableDoNotDisturb() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ startTime, endTime }: { startTime?: string; endTime?: string }) =>
      notificationsApi.enableDoNotDisturb(startTime, endTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.preferences });
      toast.success('Do Not Disturb enabled');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to enable Do Not Disturb');
    },
  });
}

/**
 * Disable Do Not Disturb mode
 */
export function useDisableDoNotDisturb() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.disableDoNotDisturb(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.preferences });
      toast.success('Do Not Disturb disabled');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to disable Do Not Disturb');
    },
  });
}

/**
 * Get notification history
 */
export function useNotificationHistory(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.notifications.history(params),
    queryFn: () => notificationsApi.getHistory(params),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Clear notification history
 */
export function useClearNotificationHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.history() });
      toast.success('Notification history cleared');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to clear history');
    },
  });
}
