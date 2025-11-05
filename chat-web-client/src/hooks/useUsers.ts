/**
 * Users Hooks
 * React hooks for user management with TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/lib/stores';
import { toast } from 'sonner';
import type { PaginationParams } from '@/types/api.types';
import type { User } from '@/types/entities.types';

/**
 * Search users by username, email, or name
 */
export function useSearchUsers(params: { query?: string } & PaginationParams) {
  return useQuery({
    queryKey: queryKeys.users.search(params),
    queryFn: () => usersApi.searchUsers(params),
    enabled: !!params.query && params.query.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    meta: {
      errorMessage: 'Failed to search users',
    },
  });
}

/**
 * Get user by ID
 */
export function useUser(id: string | null) {
  return useQuery({
    queryKey: queryKeys.users.detail(id!),
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Failed to load user',
    },
  });
}

/**
 * Get current user profile
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: () => usersApi.getMe(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Failed to load profile',
    },
  });
}

/**
 * Update current user profile
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const { user, setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (data: Partial<User>) => usersApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      // Update query cache
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });

      // Update auth store with new user data
      if (user) {
        setAuth({ ...user, ...updatedUser }, useAuthStore.getState().accessToken || '');
      }

      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    },
  });
}

/**
 * Update user avatar
 */
export function useUpdateAvatar() {
  const queryClient = useQueryClient();
  const { user, setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (file: File) => usersApi.updateAvatar(file),
    onSuccess: (data) => {
      // Update query cache
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });

      // Update auth store with new avatar URL
      if (user) {
        setAuth({ ...user, avatarUrl: data.avatarUrl }, useAuthStore.getState().accessToken || '');
      }

      toast.success('Avatar updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update avatar');
    },
  });
}

/**
 * Get blocked users
 */
export function useBlockedUsers() {
  return useQuery({
    queryKey: queryKeys.users.blocked,
    queryFn: () => usersApi.getBlockedUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Block a user
 */
export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersApi.blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.blocked });
      toast.success('User blocked successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to block user');
    },
  });
}

/**
 * Unblock a user
 */
export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersApi.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.blocked });
      toast.success('User unblocked successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to unblock user');
    },
  });
}
