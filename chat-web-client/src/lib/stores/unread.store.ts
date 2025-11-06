import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UnreadState {
  unreadCounts: Map<string, number>; // conversationId -> count
  totalUnread: number;

  incrementUnread: (conversationId: string) => void;
  resetUnread: (conversationId: string) => void;
  setUnreadCount: (conversationId: string, count: number) => void;
  clearAll: () => void;
}

/**
 * Unread Message Counter Store
 *
 * Tracks unread message counts per conversation with localStorage persistence.
 * Used for displaying badges in sidebar and conversation list.
 */
export const useUnreadStore = create<UnreadState>()(
  persist(
    (set, get) => ({
      unreadCounts: new Map<string, number>(),
      totalUnread: 0,

      /**
       * Increment unread count for a specific conversation
       */
      incrementUnread: (conversationId: string) => {
        set((state) => {
          const newCounts = new Map(state.unreadCounts);
          const current = newCounts.get(conversationId) || 0;
          newCounts.set(conversationId, current + 1);

          return {
            unreadCounts: newCounts,
            totalUnread: Array.from(newCounts.values()).reduce(
              (sum, count) => sum + count,
              0
            ),
          };
        });
      },

      /**
       * Reset unread count for a specific conversation
       */
      resetUnread: (conversationId: string) => {
        set((state) => {
          const newCounts = new Map(state.unreadCounts);
          newCounts.delete(conversationId);

          return {
            unreadCounts: newCounts,
            totalUnread: Array.from(newCounts.values()).reduce(
              (sum, count) => sum + count,
              0
            ),
          };
        });
      },

      /**
       * Set specific unread count for a conversation
       */
      setUnreadCount: (conversationId: string, count: number) => {
        set((state) => {
          const newCounts = new Map(state.unreadCounts);

          if (count > 0) {
            newCounts.set(conversationId, count);
          } else {
            newCounts.delete(conversationId);
          }

          return {
            unreadCounts: newCounts,
            totalUnread: Array.from(newCounts.values()).reduce(
              (sum, count) => sum + count,
              0
            ),
          };
        });
      },

      /**
       * Clear all unread counts (useful on logout)
       */
      clearAll: () => {
        set({
          unreadCounts: new Map(),
          totalUnread: 0,
        });
      },
    }),
    {
      name: 'unread-storage',
      // Custom storage to handle Map serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;

          try {
            const parsed = JSON.parse(str);
            return {
              state: {
                ...parsed.state,
                unreadCounts: new Map(Object.entries(parsed.state.unreadCounts || {})),
              },
            };
          } catch (error) {
            console.error('Failed to parse unread storage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            const str = JSON.stringify({
              state: {
                ...value.state,
                unreadCounts: Object.fromEntries(value.state.unreadCounts),
              },
            });
            localStorage.setItem(name, str);
          } catch (error) {
            console.error('Failed to save unread storage:', error);
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

/**
 * Hook to get unread count for a specific conversation
 */
export function useConversationUnread(conversationId: string): number {
  return useUnreadStore((state) => state.unreadCounts.get(conversationId) || 0);
}

/**
 * Hook to get total unread count across all conversations
 */
export function useTotalUnread(): number {
  return useUnreadStore((state) => state.totalUnread);
}
