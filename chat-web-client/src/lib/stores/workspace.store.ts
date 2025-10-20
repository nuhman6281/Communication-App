import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCallback } from 'react';
import type { Workspace } from '@/types/entities.types';

/**
 * Workspace State Interface
 * Manages current workspace context and workspace list
 */
interface WorkspaceState {
  // Current active workspace
  currentWorkspaceId: string | null;

  // List of all user workspaces
  workspaces: Workspace[];

  // Actions
  setCurrentWorkspace: (workspaceId: string | null) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (workspaceId: string, updates: Partial<Workspace>) => void;
  removeWorkspace: (workspaceId: string) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  clearWorkspaces: () => void;
}

/**
 * Workspace Store
 * Global state management for workspace context
 * Persisted to localStorage for session continuity
 */
export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      // Initial state
      currentWorkspaceId: null,
      workspaces: [],

      // Set current active workspace
      setCurrentWorkspace: (workspaceId) =>
        set({ currentWorkspaceId: workspaceId }),

      // Add a new workspace to the list
      addWorkspace: (workspace) =>
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
        })),

      // Update an existing workspace
      updateWorkspace: (workspaceId, updates) =>
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === workspaceId ? { ...ws, ...updates } : ws
          ),
        })),

      // Remove a workspace from the list
      removeWorkspace: (workspaceId) =>
        set((state) => ({
          workspaces: state.workspaces.filter((ws) => ws.id !== workspaceId),
          // Clear current workspace if it's the one being removed
          currentWorkspaceId:
            state.currentWorkspaceId === workspaceId
              ? null
              : state.currentWorkspaceId,
        })),

      // Set entire workspace list (useful for initial load)
      setWorkspaces: (workspaces) => set({ workspaces }),

      // Clear all workspaces (useful for logout)
      clearWorkspaces: () =>
        set({ workspaces: [], currentWorkspaceId: null }),
    }),
    {
      name: 'workspace-storage', // localStorage key
    }
  )
);

// ============================================================================
// Selector Hooks (for convenience)
// ============================================================================

/**
 * Get current workspace ID
 */
export const useCurrentWorkspaceId = () =>
  useWorkspaceStore((state) => state.currentWorkspaceId);

/**
 * Get current workspace object
 */
export const useCurrentWorkspace = () =>
  useWorkspaceStore((state) =>
    state.workspaces.find((ws) => ws.id === state.currentWorkspaceId)
  );

/**
 * Get all workspaces
 */
export const useWorkspaces = () =>
  useWorkspaceStore((state) => state.workspaces);

/**
 * Get workspace actions with stable references
 */
export const useWorkspaceActions = () => {
  const setCurrentWorkspace = useCallback(
    (workspaceId: string | null) =>
      useWorkspaceStore.getState().setCurrentWorkspace(workspaceId),
    []
  );

  const addWorkspace = useCallback(
    (workspace: Workspace) =>
      useWorkspaceStore.getState().addWorkspace(workspace),
    []
  );

  const updateWorkspace = useCallback(
    (workspaceId: string, updates: Partial<Workspace>) =>
      useWorkspaceStore.getState().updateWorkspace(workspaceId, updates),
    []
  );

  const removeWorkspace = useCallback(
    (workspaceId: string) =>
      useWorkspaceStore.getState().removeWorkspace(workspaceId),
    []
  );

  const setWorkspaces = useCallback(
    (workspaces: Workspace[]) =>
      useWorkspaceStore.getState().setWorkspaces(workspaces),
    []
  );

  const clearWorkspaces = useCallback(
    () => useWorkspaceStore.getState().clearWorkspaces(),
    []
  );

  return {
    setCurrentWorkspace,
    addWorkspace,
    updateWorkspace,
    removeWorkspace,
    setWorkspaces,
    clearWorkspaces,
  };
};
