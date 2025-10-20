/**
 * Conversation Store (Zustand)
 * Manages active conversation, selected conversation, and conversation-related UI state
 */

import { create } from 'zustand';
import type { Conversation } from '@/types/entities.types';

interface ConversationState {
  // State
  selectedConversationId: string | null;
  selectedConversation: Conversation | null;
  replyToMessageId: string | null;
  editMessageId: string | null;
  forwardMessageIds: string[];
  searchQuery: string;
  searchInConversation: boolean;

  // Draft messages (persist unsent messages)
  drafts: Record<string, string>; // conversationId -> draft content

  // Actions
  setSelectedConversation: (conversationId: string | null, conversation?: Conversation | null) => void;
  setReplyToMessage: (messageId: string | null) => void;
  setEditMessage: (messageId: string | null) => void;
  setForwardMessages: (messageIds: string[]) => void;
  clearForwardMessages: () => void;
  setSearchQuery: (query: string) => void;
  setSearchInConversation: (enabled: boolean) => void;
  setDraft: (conversationId: string, content: string) => void;
  getDraft: (conversationId: string) => string;
  clearDraft: (conversationId: string) => void;
  clearAll: () => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  // Initial state
  selectedConversationId: null,
  selectedConversation: null,
  replyToMessageId: null,
  editMessageId: null,
  forwardMessageIds: [],
  searchQuery: '',
  searchInConversation: false,
  drafts: {},

  // Actions
  setSelectedConversation: (conversationId, conversation) =>
    set({
      selectedConversationId: conversationId,
      selectedConversation: conversation || null,
      // Clear message actions when switching conversations
      replyToMessageId: null,
      editMessageId: null,
      searchQuery: '',
      searchInConversation: false,
    }),

  setReplyToMessage: (messageId) =>
    set({
      replyToMessageId: messageId,
      editMessageId: null, // Can't reply and edit at same time
    }),

  setEditMessage: (messageId) =>
    set({
      editMessageId: messageId,
      replyToMessageId: null, // Can't edit and reply at same time
    }),

  setForwardMessages: (messageIds) =>
    set({ forwardMessageIds: messageIds }),

  clearForwardMessages: () =>
    set({ forwardMessageIds: [] }),

  setSearchQuery: (query) =>
    set({ searchQuery: query }),

  setSearchInConversation: (enabled) =>
    set({ searchInConversation: enabled }),

  setDraft: (conversationId, content) =>
    set((state) => ({
      drafts: { ...state.drafts, [conversationId]: content },
    })),

  getDraft: (conversationId) => {
    const state = get();
    return state.drafts[conversationId] || '';
  },

  clearDraft: (conversationId) =>
    set((state) => {
      const { [conversationId]: _, ...rest } = state.drafts;
      return { drafts: rest };
    }),

  clearAll: () =>
    set({
      selectedConversationId: null,
      selectedConversation: null,
      replyToMessageId: null,
      editMessageId: null,
      forwardMessageIds: [],
      searchQuery: '',
      searchInConversation: false,
    }),
}));

// Selector hooks for specific state slices
export const useSelectedConversation = () => useConversationStore((state) => ({
  id: state.selectedConversationId,
  conversation: state.selectedConversation,
}));

export const useReplyToMessage = () => useConversationStore((state) => state.replyToMessageId);
export const useEditMessage = () => useConversationStore((state) => state.editMessageId);
export const useForwardMessages = () => useConversationStore((state) => state.forwardMessageIds);
export const useConversationSearch = () => useConversationStore((state) => ({
  query: state.searchQuery,
  enabled: state.searchInConversation,
}));
