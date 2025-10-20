/**
 * AI Hooks
 * React hooks for AI-powered features with TanStack Query
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { aiApi, type ToneType, type TranslationLanguage } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query-client';

/**
 * Generate smart reply suggestions for a message
 * FREE tier feature
 */
export function useSmartReplies(messageContent: string, context?: string) {
  return useQuery({
    queryKey: queryKeys.ai.smartReplies(messageContent),
    queryFn: async () => {
      // Backend expects: { message, count, context }
      const response = await aiApi.getSmartReplies(messageContent, 3);
      return response;
    },
    enabled: !!messageContent && messageContent.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    meta: {
      errorMessage: 'Failed to generate smart replies',
    },
  });
}

/**
 * Enhance message with AI tone adjustment
 * PREMIUM tier feature
 */
export function useEnhanceMessage() {
  return useMutation({
    mutationFn: async ({ content, tone }: { content: string; tone: ToneType }) => {
      const response = await aiApi.enhanceMessage(content, tone);
      return response;
    },
    meta: {
      successMessage: 'Message enhanced successfully',
      errorMessage: 'Failed to enhance message. Please check your subscription tier.',
    },
  });
}

/**
 * Translate message to target language
 * FREE tier feature
 */
export function useTranslate() {
  return useMutation({
    mutationFn: async ({
      content,
      targetLanguage,
      sourceLanguage,
    }: {
      content: string;
      targetLanguage: TranslationLanguage;
      sourceLanguage?: TranslationLanguage;
    }) => {
      const response = await aiApi.translate(content, targetLanguage, sourceLanguage);
      return response;
    },
    meta: {
      successMessage: 'Message translated successfully',
      errorMessage: 'Failed to translate message',
    },
  });
}

/**
 * Summarize conversation or text
 * PREMIUM tier feature
 */
export function useSummarize() {
  return useMutation({
    mutationFn: async ({ conversationId, messageIds }: { conversationId: string; messageIds?: string[] }) => {
      const response = await aiApi.summarize(conversationId, messageIds);
      return response;
    },
    meta: {
      successMessage: 'Conversation summarized successfully',
      errorMessage: 'Failed to summarize conversation. Please check your subscription tier.',
    },
  });
}

/**
 * Detect language of text
 */
export function useDetectLanguage() {
  return useMutation({
    mutationFn: async (content: string) => {
      const response = await aiApi.detectLanguage(content);
      return response;
    },
    meta: {
      errorMessage: 'Failed to detect language',
    },
  });
}

/**
 * Check grammar and spelling
 */
export function useCheckGrammar() {
  return useMutation({
    mutationFn: async (content: string) => {
      const response = await aiApi.checkGrammar(content);
      return response;
    },
    meta: {
      successMessage: 'Grammar checked successfully',
      errorMessage: 'Failed to check grammar',
    },
  });
}

/**
 * Get AI usage statistics
 */
export function useAIUsageStats() {
  return useQuery({
    queryKey: queryKeys.ai.usageStats,
    queryFn: aiApi.getUsageStats,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    meta: {
      errorMessage: 'Failed to load AI usage statistics',
    },
  });
}
