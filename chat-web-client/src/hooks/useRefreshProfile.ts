/**
 * useRefreshProfile Hook
 * Hook to refresh user profile data from the server
 */

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { toast } from 'sonner';

export function useRefreshProfile() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshUser = useAuthStore((state) => state.refreshUser);

  const refresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refreshUser();
      toast.success('Profile refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      toast.error('Failed to refresh profile. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    refresh,
    isRefreshing,
  };
}
