/**
 * Axios HTTP Client
 * Configured instance with interceptors for auth, error handling, and retries
 */

import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/config/api.config';

// Types
interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

// Create axios instance
console.log('🔧 API_CONFIG.baseURL:', API_CONFIG.baseURL);
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// Request Interceptor
// ============================================================================

apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptor
// ============================================================================

apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }

    // Extract data from success response wrapper
    if (response.data?.success) {
      return { ...response, data: response.data.data };
    }

    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as RetryConfig;

    // Log error in development
    if (import.meta.env.DEV) {
      console.error('❌ API Error:', {
        url: config?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !config?._retry) {
      config._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Attempt to refresh token
        const response = await axios.post(
          `${API_CONFIG.baseURL}/auth/refresh`,
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Store new tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request with new token
        if (config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(config);
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Redirect to login (handled by auth store)
        window.dispatchEvent(new Event('auth:logout'));

        return Promise.reject(refreshError);
      }
    }

    // Handle network errors with retry logic
    if (
      (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) &&
      config &&
      !config._retry
    ) {
      config._retryCount = config._retryCount || 0;

      if (config._retryCount < API_CONFIG.retryAttempts) {
        config._retryCount += 1;

        console.log(`🔄 Retrying request (${config._retryCount}/${API_CONFIG.retryAttempts})...`);

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, API_CONFIG.retryDelay * config._retryCount));

        return apiClient(config);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('🚫 Access Forbidden');
      // Optionally show error toast
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error('🔍 Resource Not Found');
    }

    // Handle 500 Server Error
    if (error.response?.status === 500) {
      console.error('💥 Server Error');
      // Optionally show error toast
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract error message from API error response
 */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as any;

    if (apiError?.message) {
      if (Array.isArray(apiError.message.message)) {
        return apiError.message.message.join(', ');
      }
      if (typeof apiError.message === 'string') {
        return apiError.message;
      }
      if (typeof apiError.message.message === 'string') {
        return apiError.message.message;
      }
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}

// Alias for backward compatibility
export const getErrorMessage = extractErrorMessage;

/**
 * Check if error is authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 401;
  }
  return false;
}

/**
 * Check if error is network error
 */
export function isNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return !error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';
  }
  return false;
}

export default apiClient;
