/**
 * UI Store (Zustand)
 * Manages UI state, theme, modal visibility, and user preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ViewType = 'chat' | 'profile' | 'settings' | 'video-call' | 'stories' | 'workspace' | 'create-group';

interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system';

  // Layout
  currentView: ViewType;
  showConversationList: boolean;
  showNotificationsPanel: boolean;
  sidebarCollapsed: boolean;

  // Modals and dialogs
  modals: {
    globalSearch: boolean;
    aiAssistant: boolean;
    filePreview: boolean;
    createGroup: boolean;
    createChannel: boolean;
    userProfile: boolean;
    settings: boolean;
    callIncoming: boolean;
  };

  // File preview
  previewFile: {
    id: string;
    url: string;
    type: string;
    name: string;
  } | null;

  // User preferences
  preferences: {
    compactMode: boolean;
    showAvatars: boolean;
    enterToSend: boolean;
    notificationSounds: boolean;
    messagePreview: boolean;
    autoPlayVideos: boolean;
    fontSize: 'small' | 'medium' | 'large';
    language: string;
  };

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCurrentView: (view: ViewType) => void;
  toggleConversationList: () => void;
  toggleNotificationsPanel: () => void;
  toggleSidebar: () => void;
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  closeAllModals: () => void;
  setPreviewFile: (file: UIState['previewFile']) => void;
  updatePreferences: (preferences: Partial<UIState['preferences']>) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      theme: 'dark',
      currentView: 'chat',
      showConversationList: true,
      showNotificationsPanel: false,
      sidebarCollapsed: false,

      modals: {
        globalSearch: false,
        aiAssistant: false,
        filePreview: false,
        createGroup: false,
        createChannel: false,
        userProfile: false,
        settings: false,
        callIncoming: false,
      },

      previewFile: null,

      preferences: {
        compactMode: false,
        showAvatars: true,
        enterToSend: true,
        notificationSounds: true,
        messagePreview: true,
        autoPlayVideos: false,
        fontSize: 'medium',
        language: 'en',
      },

      // Actions
      setTheme: (theme) => {
        set({ theme });

        // Apply theme to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          // System theme
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },

      setCurrentView: (view) => set({ currentView: view }),

      toggleConversationList: () =>
        set((state) => ({ showConversationList: !state.showConversationList })),

      toggleNotificationsPanel: () =>
        set((state) => ({ showNotificationsPanel: !state.showNotificationsPanel })),

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      openModal: (modal) =>
        set((state) => ({
          modals: { ...state.modals, [modal]: true },
        })),

      closeModal: (modal) =>
        set((state) => ({
          modals: { ...state.modals, [modal]: false },
        })),

      closeAllModals: () =>
        set((state) => ({
          modals: Object.keys(state.modals).reduce(
            (acc, key) => ({ ...acc, [key]: false }),
            {} as UIState['modals']
          ),
        })),

      setPreviewFile: (file) => set({ previewFile: file }),

      updatePreferences: (preferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        })),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist theme and preferences, but not temporary UI state
      partialize: (state) => ({
        theme: state.theme,
        preferences: state.preferences,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// Selector hooks for specific state slices
export const useTheme = () => useUIStore((state) => state.theme);
export const useCurrentView = () => useUIStore((state) => state.currentView);
export const useModals = () => useUIStore((state) => state.modals);
export const usePreferences = () => useUIStore((state) => state.preferences);
