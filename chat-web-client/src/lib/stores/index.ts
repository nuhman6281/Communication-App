/**
 * Stores Barrel Export
 * Centralized export for all Zustand stores
 */

// Auth Store
export {
  useAuthStore,
  useUser,
  useIsAuthenticated,
  useAuthLoading,
} from './auth.store';

// UI Store
export {
  useUIStore,
  useTheme,
  useCurrentView,
  useModals,
  usePreferences,
} from './ui.store';

// Conversation Store
export {
  useConversationStore,
  useSelectedConversation,
  useReplyToMessage,
  useEditMessage,
  useForwardMessages,
  useConversationSearch,
} from './conversation.store';

// Presence Store
export {
  usePresenceStore,
  useUserPresence,
  useTypingUsers,
  useMyPresence,
  useOnlineUsers,
  startTypingCleanup,
} from './presence.store';

// Workspace Store
export {
  useWorkspaceStore,
  useCurrentWorkspaceId,
  useCurrentWorkspace,
  useWorkspaces,
  useWorkspaceActions,
} from './workspace.store';

// Re-export types
export type { ViewType } from './ui.store';
