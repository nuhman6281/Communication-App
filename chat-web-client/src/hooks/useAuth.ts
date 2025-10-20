/**
 * Auth Hooks
 * React hooks for authentication with TanStack Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/lib/stores';
import type { LoginRequest, RegisterRequest } from '@/types/api.types';

/**
 * Get current authenticated user
 */
export function useCurrentUser() {
  const { user, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.auth.currentUser,
    queryFn: authApi.getCurrentUser,
    enabled: isAuthenticated && !user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      errorMessage: 'Failed to fetch user profile',
    },
  });
}

/**
 * Login mutation
 */
export function useLogin() {
  const { setAuth, setLoading } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (response) => {
      // Store auth data
      setAuth(response.user as any, response.accessToken, response.refreshToken);

      // Set user in query cache
      queryClient.setQueryData(queryKeys.auth.currentUser, response.user);

      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
    meta: {
      successMessage: 'Login successful!',
      errorMessage: 'Login failed. Please check your credentials.',
    },
  });
}

/**
 * Register mutation
 */
export function useRegister() {
  const { setLoading } = useAuthStore();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: () => {
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
    meta: {
      successMessage: 'Registration successful! Please check your email to verify your account.',
      errorMessage: 'Registration failed. Please try again.',
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const { logout, refreshToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      // Get refresh token from localStorage as fallback
      const token = refreshToken || localStorage.getItem('refreshToken') || '';
      return authApi.logout(token);
    },
    onSuccess: () => {
      // Clear auth state
      logout();

      // Clear all query cache
      queryClient.clear();
    },
    meta: {
      successMessage: 'Logged out successfully',
      showErrorToast: false, // Don't show error toast for logout failures
    },
  });
}

/**
 * Verify email mutation
 */
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
    meta: {
      successMessage: 'Email verified successfully! You can now login.',
      errorMessage: 'Email verification failed. The link may be expired.',
    },
  });
}

/**
 * Request password reset mutation
 */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => authApi.requestPasswordReset(email),
    meta: {
      successMessage: 'Password reset email sent! Please check your inbox.',
      errorMessage: 'Failed to send password reset email.',
    },
  });
}

/**
 * Reset password mutation
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authApi.resetPassword(token, newPassword),
    meta: {
      successMessage: 'Password reset successfully! You can now login.',
      errorMessage: 'Password reset failed. The link may be expired.',
    },
  });
}

/**
 * Update user profile mutation
 */
export function useUpdateProfile() {
  const { updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.getCurrentUser,
    onSuccess: (updatedUser) => {
      // Update auth store
      updateUser(updatedUser);

      // Update query cache
      queryClient.setQueryData(queryKeys.auth.currentUser, updatedUser);
    },
    meta: {
      successMessage: 'Profile updated successfully',
      errorMessage: 'Failed to update profile',
    },
  });
}
