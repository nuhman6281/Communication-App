/**
 * AI API Service
 * Handles AI-powered features (smart replies, enhancement, translation, transcription)
 */

import { apiClient } from '../client';

export type ToneType = 'professional' | 'casual' | 'formal' | 'friendly' | 'concise';
export type TranslationLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'ar' | 'hi';

export const aiApi = {
  /**
   * Generate smart reply suggestions (Free tier)
   */
  getSmartReplies: async (message: string, count?: number, context?: string): Promise<{
    replies: string[];
    count: number;
  }> => {
    const response = await apiClient.post('/ai/smart-replies', {
      message,
      count: count || 3,
      context,
    });
    return response.data;
  },

  /**
   * Enhance message with AI (Premium tier)
   */
  enhanceMessage: async (
    content: string,
    tone: ToneType,
    context?: string
  ): Promise<{
    original: string;
    enhanced: string;
    tone: string;
  }> => {
    const response = await apiClient.post('/ai/enhance', {
      message: content,
      tone,
      context,
    });
    return response.data;
  },

  /**
   * Translate message (Free tier - basic languages, Premium - all languages)
   */
  translate: async (
    content: string,
    targetLanguage: TranslationLanguage,
    sourceLanguage?: TranslationLanguage
  ): Promise<{
    original: string;
    translation: string;
    targetLanguage: string;
    detectedLanguage: string;
  }> => {
    const response = await apiClient.post('/ai/translate', {
      message: content,
      targetLanguage,
      sourceLanguage,
    });
    return response.data;
  },

  /**
   * Detect language of text
   */
  detectLanguage: async (content: string): Promise<{
    language: TranslationLanguage;
    confidence: number;
    alternativeLanguages: Array<{ language: string; confidence: number }>;
  }> => {
    const response = await apiClient.post('/ai/detect-language', { content });
    return response.data;
  },

  /**
   * Transcribe audio/video to text (Premium tier)
   */
  transcribe: async (fileId: string, language?: string): Promise<{
    text: string;
    language: string;
    duration: number;
    confidence: number;
    segments: Array<{
      text: string;
      start: number;
      end: number;
      confidence: number;
    }>;
  }> => {
    const response = await apiClient.post('/ai/transcribe', {
      fileId,
      language,
    });
    return response.data;
  },

  /**
   * Summarize conversation or messages (Premium tier)
   */
  summarize: async (
    text: string,
    type?: 'brief' | 'detailed' | 'bullet_points' | 'action_items',
    context?: string
  ): Promise<{
    summary: string;
    type: string;
    originalLength: number;
    summaryLength: number;
  }> => {
    const response = await apiClient.post('/ai/summarize', {
      text,
      type,
      context,
    });
    return response.data;
  },

  /**
   * Generate image from text prompt (Premium tier - DALL-E)
   */
  generateImage: async (
    prompt: string,
    size?: '256x256' | '512x512' | '1024x1024'
  ): Promise<{
    imageUrl: string;
    prompt: string;
    size: string;
  }> => {
    const response = await apiClient.post('/ai/generate-image', {
      prompt,
      size: size || '1024x1024',
    });
    return response.data;
  },

  /**
   * Analyze image/photo content
   */
  analyzeImage: async (fileId: string): Promise<{
    description: string;
    labels: string[];
    objects: Array<{ name: string; confidence: number }>;
    text: string | null;
    faces: number;
    isInappropriate: boolean;
  }> => {
    const response = await apiClient.post('/ai/analyze-image', { fileId });
    return response.data;
  },

  /**
   * Detect spam/abuse in message
   */
  detectSpam: async (content: string): Promise<{
    isSpam: boolean;
    confidence: number;
    categories: string[];
    reason: string | null;
  }> => {
    const response = await apiClient.post('/ai/detect-spam', { content });
    return response.data;
  },

  /**
   * Get AI-powered conversation insights
   */
  getConversationInsights: async (conversationId: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    topics: Array<{ topic: string; relevance: number }>;
    keywords: string[];
    engagement: {
      messageFrequency: number;
      averageResponseTime: number;
      activeParticipants: number;
    };
    suggestions: string[];
  }> => {
    const response = await apiClient.get(`/ai/insights/${conversationId}`);
    return response.data;
  },

  /**
   * Suggest conversation topics/icebreakers
   */
  suggestTopics: async (conversationId: string): Promise<{
    topics: string[];
    questions: string[];
    context: string;
  }> => {
    const response = await apiClient.get(`/ai/suggest-topics/${conversationId}`);
    return response.data;
  },

  /**
   * Extract action items from conversation
   */
  extractActionItems: async (
    conversationId: string,
    messageIds?: string[]
  ): Promise<{
    actionItems: Array<{
      task: string;
      assignee: string | null;
      dueDate: string | null;
      priority: 'low' | 'medium' | 'high';
    }>;
    decisions: string[];
    questions: string[];
  }> => {
    const response = await apiClient.post('/ai/extract-actions', {
      conversationId,
      messageIds,
    });
    return response.data;
  },

  /**
   * Grammar and spelling check
   */
  checkGrammar: async (content: string): Promise<{
    corrections: Array<{
      original: string;
      suggestion: string;
      type: 'grammar' | 'spelling' | 'punctuation';
      position: { start: number; end: number };
    }>;
    correctedText: string;
    score: number;
  }> => {
    const response = await apiClient.post('/ai/check-grammar', { content });
    return response.data;
  },

  /**
   * Get AI usage statistics and limits
   */
  getUsageStats: async (): Promise<{
    tier: 'free' | 'premium' | 'business' | 'enterprise';
    limits: {
      smartReplies: { used: number; limit: number };
      enhancements: { used: number; limit: number };
      translations: { used: number; limit: number };
      transcriptions: { used: number; limit: number };
      imageGeneration: { used: number; limit: number };
    };
    resetDate: string;
  }> => {
    const response = await apiClient.get('/ai/usage-stats');
    return response.data;
  },
};
