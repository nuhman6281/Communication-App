/**
 * Auth Store (Zustand)
 * Manages authentication state and user session
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/entities.types';
import { usersApi } from '@/lib/api/endpoints/users.api';

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setAuth: (user, accessToken, refreshToken) => {
        // Store tokens in localStorage for API client
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),

      updateTokens: (accessToken, refreshToken) => {
        // Update tokens in localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        set({ accessToken, refreshToken });
      },

      refreshUser: async () => {
        set({ isLoading: true });
        try {
          const userData = await usersApi.getMe();

          set((state) => ({
            user: userData,
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to refresh user:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        console.log('[AuthStore] 🚪 Logging out user...');

        // Clear tokens from localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Update state
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });

        // Emit logout event for socket cleanup
        if (typeof window !== 'undefined') {
          console.log('[AuthStore] Emitting logout event for socket cleanup...');
          window.dispatchEvent(new CustomEvent('app:logout'));
        }

        console.log('[AuthStore] ✅ Logout complete');
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist user info, not tokens (tokens are stored separately)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks for specific state slices
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);

// Listen for logout events from API interceptor
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    console.log('🚪 Logout event received, clearing auth state');
    useAuthStore.getState().logout();
  });
}
