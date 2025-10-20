/**
 * Presence Store (Zustand)
 * Manages user presence status, typing indicators, and online users
 */

import { create } from 'zustand';
import type { PresenceStatus } from '@/types/entities.types';

interface UserPresence {
  userId: string;
  status: PresenceStatus;
  customStatus: string | null;
  lastSeenAt: string | null;
  isOnline: boolean;
}

interface TypingUser {
  userId: string;
  username: string;
  avatarUrl: string | null;
  conversationId: string;
  startedAt: number;
}

interface PresenceState {
  // User presence map (userId -> presence)
  presenceMap: Record<string, UserPresence>;

  // Typing indicators (conversationId -> users typing)
  typingMap: Record<string, TypingUser[]>;

  // My current status
  myStatus: PresenceStatus;
  myCustomStatus: string | null;

  // Actions
  setPresence: (userId: string, presence: UserPresence) => void;
  setBatchPresence: (presences: UserPresence[]) => void;
  removePresence: (userId: string) => void;
  setMyStatus: (status: PresenceStatus, customStatus?: string | null) => void;

  // Typing indicators
  addTypingUser: (conversationId: string, user: Omit<TypingUser, 'conversationId' | 'startedAt'>) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  clearTypingUsers: (conversationId: string) => void;
  cleanupExpiredTyping: () => void; // Remove typing indicators older than 5 seconds

  // Getters
  getPresence: (userId: string) => UserPresence | null;
  getTypingUsers: (conversationId: string) => TypingUser[];
  isUserOnline: (userId: string) => boolean;
  getOnlineUsers: () => UserPresence[];
}

const TYPING_TIMEOUT = 5000; // 5 seconds

export const usePresenceStore = create<PresenceState>((set, get) => ({
  // Initial state
  presenceMap: {},
  typingMap: {},
  myStatus: 'online',
  myCustomStatus: null,

  // Actions
  setPresence: (userId, presence) =>
    set((state) => ({
      presenceMap: {
        ...state.presenceMap,
        [userId]: presence,
      },
    })),

  setBatchPresence: (presences) =>
    set((state) => {
      const newPresenceMap = { ...state.presenceMap };
      presences.forEach((presence) => {
        newPresenceMap[presence.userId] = presence;
      });
      return { presenceMap: newPresenceMap };
    }),

  removePresence: (userId) =>
    set((state) => {
      const { [userId]: _, ...rest } = state.presenceMap;
      return { presenceMap: rest };
    }),

  setMyStatus: (status, customStatus) =>
    set({
      myStatus: status,
      myCustomStatus: customStatus ?? null,
    }),

  // Typing indicators
  addTypingUser: (conversationId, user) =>
    set((state) => {
      const currentTyping = state.typingMap[conversationId] || [];

      // Check if user is already in typing list
      const existingIndex = currentTyping.findIndex((u) => u.userId === user.userId);

      const newTypingUser: TypingUser = {
        ...user,
        conversationId,
        startedAt: Date.now(),
      };

      let updatedTyping: TypingUser[];
      if (existingIndex >= 0) {
        // Update existing typing user timestamp
        updatedTyping = [...currentTyping];
        updatedTyping[existingIndex] = newTypingUser;
      } else {
        // Add new typing user
        updatedTyping = [...currentTyping, newTypingUser];
      }

      return {
        typingMap: {
          ...state.typingMap,
          [conversationId]: updatedTyping,
        },
      };
    }),

  removeTypingUser: (conversationId, userId) =>
    set((state) => {
      const currentTyping = state.typingMap[conversationId] || [];
      const updatedTyping = currentTyping.filter((u) => u.userId !== userId);

      if (updatedTyping.length === 0) {
        // Remove conversation from map if no one is typing
        const { [conversationId]: _, ...rest } = state.typingMap;
        return { typingMap: rest };
      }

      return {
        typingMap: {
          ...state.typingMap,
          [conversationId]: updatedTyping,
        },
      };
    }),

  clearTypingUsers: (conversationId) =>
    set((state) => {
      const { [conversationId]: _, ...rest } = state.typingMap;
      return { typingMap: rest };
    }),

  cleanupExpiredTyping: () =>
    set((state) => {
      const now = Date.now();
      const newTypingMap: Record<string, TypingUser[]> = {};

      Object.entries(state.typingMap).forEach(([conversationId, users]) => {
        const activeUsers = users.filter((user) => now - user.startedAt < TYPING_TIMEOUT);
        if (activeUsers.length > 0) {
          newTypingMap[conversationId] = activeUsers;
        }
      });

      return { typingMap: newTypingMap };
    }),

  // Getters
  getPresence: (userId) => {
    const state = get();
    return state.presenceMap[userId] || null;
  },

  getTypingUsers: (conversationId) => {
    const state = get();
    return state.typingMap[conversationId] || [];
  },

  isUserOnline: (userId) => {
    const state = get();
    return state.presenceMap[userId]?.isOnline || false;
  },

  getOnlineUsers: () => {
    const state = get();
    return Object.values(state.presenceMap).filter((presence) => presence.isOnline);
  },
}));

// Selector hooks
export const useUserPresence = (userId: string) =>
  usePresenceStore((state) => state.presenceMap[userId] || null);

export const useTypingUsers = (conversationId: string) =>
  usePresenceStore((state) => state.typingMap[conversationId]);

export const useMyPresence = () =>
  usePresenceStore((state) => ({
    status: state.myStatus,
    customStatus: state.myCustomStatus,
  }));

export const useOnlineUsers = () =>
  usePresenceStore((state) => Object.values(state.presenceMap).filter((p) => p.isOnline));

// Utility function to start periodic cleanup of expired typing indicators
export const startTypingCleanup = () => {
  return setInterval(() => {
    usePresenceStore.getState().cleanupExpiredTyping();
  }, 1000); // Check every second
};
