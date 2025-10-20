/**
 * Auth API Service
 * Handles authentication-related API calls
 */

import { apiClient } from '../client';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '@/types/api.types';
import type { User } from '@/types/entities.types';

export const authApi = {
  /**
   * Login with email/username and password
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  /**
   * Register new user account
   */
  register: async (data: RegisterRequest): Promise<{ message: string; userId: string; verificationToken: string }> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  /**
   * Refresh access token using refresh token
   */
  refresh: async (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post('/auth/refresh', data);
    return response.data;
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  /**
   * Verify email with verification token
   */
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response.data;
  },

  /**
   * Request password reset email
   */
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },
};
