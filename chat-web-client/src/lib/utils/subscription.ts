/**
 * Subscription Utility Functions
 * Helper functions for checking subscription tiers and feature access
 */

import { SubscriptionTier, type User } from '@/types/entities.types';

/**
 * Check if user has premium or higher subscription
 */
export function isPremiumUser(user: User | null | undefined): boolean {
  if (!user) return false;

  return (
    user.subscriptionTier === SubscriptionTier.PREMIUM ||
    user.subscriptionTier === SubscriptionTier.BUSINESS ||
    user.subscriptionTier === SubscriptionTier.ENTERPRISE
  );
}

/**
 * Check if user has business or higher subscription
 */
export function isBusinessUser(user: User | null | undefined): boolean {
  if (!user) return false;

  return (
    user.subscriptionTier === SubscriptionTier.BUSINESS ||
    user.subscriptionTier === SubscriptionTier.ENTERPRISE
  );
}

/**
 * Check if user has enterprise subscription
 */
export function isEnterpriseUser(user: User | null | undefined): boolean {
  if (!user) return false;

  return user.subscriptionTier === SubscriptionTier.ENTERPRISE;
}

/**
 * Check if user has a specific subscription tier or higher
 */
export function hasSubscriptionTier(
  user: User | null | undefined,
  tier: SubscriptionTier
): boolean {
  if (!user) return false;

  const tierHierarchy = {
    [SubscriptionTier.FREE]: 0,
    [SubscriptionTier.PREMIUM]: 1,
    [SubscriptionTier.BUSINESS]: 2,
    [SubscriptionTier.ENTERPRISE]: 3,
  };

  return tierHierarchy[user.subscriptionTier] >= tierHierarchy[tier];
}

/**
 * Check if subscription is active (not expired)
 */
export function isSubscriptionActive(user: User | null | undefined): boolean {
  if (!user) return false;

  // Free tier is always active
  if (user.subscriptionTier === SubscriptionTier.FREE) return true;

  // If no expiry date set, treat as lifetime/active subscription
  // This handles cases where premium is granted without expiration
  if (!user.subscriptionExpiresAt) return true;

  // Check if subscription hasn't expired yet
  const expiryDate = new Date(user.subscriptionExpiresAt);
  const now = new Date();

  return expiryDate > now;
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeatureAccess(
  user: User | null | undefined,
  feature: AIFeature
): boolean {
  if (!user) return false;

  const featureAccess: Record<AIFeature, SubscriptionTier> = {
    // Free tier features
    [AIFeature.SMART_REPLIES]: SubscriptionTier.FREE,
    [AIFeature.BASIC_TRANSLATION]: SubscriptionTier.FREE,
    [AIFeature.SPAM_DETECTION]: SubscriptionTier.FREE,

    // Premium tier features
    [AIFeature.MESSAGE_ENHANCEMENT]: SubscriptionTier.PREMIUM,
    [AIFeature.ADVANCED_TRANSLATION]: SubscriptionTier.PREMIUM,
    [AIFeature.MEETING_TRANSCRIPTION]: SubscriptionTier.PREMIUM,
    [AIFeature.CONVERSATION_SUMMARY]: SubscriptionTier.PREMIUM,
    [AIFeature.IMAGE_GENERATION]: SubscriptionTier.PREMIUM,
    [AIFeature.GRAMMAR_CHECK]: SubscriptionTier.PREMIUM,

    // Business tier features
    [AIFeature.SEMANTIC_SEARCH]: SubscriptionTier.BUSINESS,
    [AIFeature.ACTION_ITEMS_EXTRACTION]: SubscriptionTier.BUSINESS,
    [AIFeature.CONVERSATION_INSIGHTS]: SubscriptionTier.BUSINESS,

    // Enterprise tier features
    [AIFeature.CUSTOM_AI_MODELS]: SubscriptionTier.ENTERPRISE,
  };

  const requiredTier = featureAccess[feature];
  return hasSubscriptionTier(user, requiredTier) && isSubscriptionActive(user);
}

/**
 * Get user-friendly subscription tier name
 */
export function getSubscriptionTierName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    [SubscriptionTier.FREE]: 'Free',
    [SubscriptionTier.PREMIUM]: 'Premium',
    [SubscriptionTier.BUSINESS]: 'Business',
    [SubscriptionTier.ENTERPRISE]: 'Enterprise',
  };

  return names[tier];
}

/**
 * AI Features enumeration
 */
export enum AIFeature {
  // Free tier
  SMART_REPLIES = 'smart_replies',
  BASIC_TRANSLATION = 'basic_translation',
  SPAM_DETECTION = 'spam_detection',

  // Premium tier
  MESSAGE_ENHANCEMENT = 'message_enhancement',
  ADVANCED_TRANSLATION = 'advanced_translation',
  MEETING_TRANSCRIPTION = 'meeting_transcription',
  CONVERSATION_SUMMARY = 'conversation_summary',
  IMAGE_GENERATION = 'image_generation',
  GRAMMAR_CHECK = 'grammar_check',

  // Business tier
  SEMANTIC_SEARCH = 'semantic_search',
  ACTION_ITEMS_EXTRACTION = 'action_items_extraction',
  CONVERSATION_INSIGHTS = 'conversation_insights',

  // Enterprise tier
  CUSTOM_AI_MODELS = 'custom_ai_models',
}
