/**
 * useSubscription Hook
 * React hook for checking user subscription status and feature access
 */

import { useMemo } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import {
  isPremiumUser,
  isBusinessUser,
  isEnterpriseUser,
  hasSubscriptionTier,
  isSubscriptionActive,
  hasFeatureAccess,
  getSubscriptionTierName,
  AIFeature,
} from '@/lib/utils/subscription';
import { SubscriptionTier } from '@/types/entities.types';

/**
 * Hook to check user subscription status and feature access
 */
export function useSubscription() {
  const user = useAuthStore((state) => state.user);

  const subscription = useMemo(() => {
    return {
      // User info
      user,
      tier: user?.subscriptionTier ?? SubscriptionTier.FREE,
      tierName: user ? getSubscriptionTierName(user.subscriptionTier) : 'Free',
      expiresAt: user?.subscriptionExpiresAt,
      isActive: isSubscriptionActive(user),

      // Tier checks
      isFree: user?.subscriptionTier === SubscriptionTier.FREE,
      isPremium: isPremiumUser(user),
      isBusiness: isBusinessUser(user),
      isEnterprise: isEnterpriseUser(user),

      // Feature access checks
      hasPremiumFeatures: isPremiumUser(user) && isSubscriptionActive(user),
      hasBusinessFeatures: isBusinessUser(user) && isSubscriptionActive(user),
      hasEnterpriseFeatures: isEnterpriseUser(user) && isSubscriptionActive(user),

      // Helper functions
      hasAccess: (feature: AIFeature) => hasFeatureAccess(user, feature),
      hasTier: (tier: SubscriptionTier) => hasSubscriptionTier(user, tier),
    };
  }, [user]);

  return subscription;
}

/**
 * Hook to check if user has access to a specific AI feature
 */
export function useFeatureAccess(feature: AIFeature) {
  const user = useAuthStore((state) => state.user);

  return useMemo(() => {
    const hasAccess = hasFeatureAccess(user, feature);
    const isActive = isSubscriptionActive(user);

    return {
      hasAccess,
      isActive,
      needsUpgrade: !hasAccess,
      currentTier: user?.subscriptionTier ?? SubscriptionTier.FREE,
    };
  }, [user, feature]);
}
