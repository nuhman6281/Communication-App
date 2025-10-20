/**
 * Users Hooks
 * React hooks for user management with TanStack Query
 */

import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query-client';
import type { PaginationParams } from '@/types/api.types';

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
