import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspacesApi } from '@/lib/api/endpoints';
import type {
  CreateWorkspaceData,
  UpdateWorkspaceData,
  InviteMemberData,
  UpdateMemberRoleData,
} from '@/types/entities.types';

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Get all workspaces for current user
 */
export function useWorkspaces(params?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
  onlyOwned?: boolean;
}) {
  return useQuery({
    queryKey: ['workspaces', params],
    queryFn: () => workspacesApi.getWorkspaces(params),
  });
}

/**
 * Get a single workspace by ID
 */
export function useWorkspace(workspaceId: string | null) {
  return useQuery({
    queryKey: ['workspaces', workspaceId],
    queryFn: () => workspacesApi.getWorkspace(workspaceId!),
    enabled: !!workspaceId,
  });
}

/**
 * Get workspace members
 */
export function useWorkspaceMembers(
  workspaceId: string | null,
  params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
  },
) {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'members', params],
    queryFn: () => workspacesApi.getWorkspaceMembers(workspaceId!, params),
    enabled: !!workspaceId,
  });
}

/**
 * Get workspace groups
 */
export function useWorkspaceGroups(
  workspaceId: string | null,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'groups', params],
    queryFn: () => workspacesApi.getWorkspaceGroups(workspaceId!, params),
    enabled: !!workspaceId,
  });
}

/**
 * Get workspace channels
 */
export function useWorkspaceChannels(
  workspaceId: string | null,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'channels', params],
    queryFn: () => workspacesApi.getWorkspaceChannels(workspaceId!, params),
    enabled: !!workspaceId,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new workspace
 */
export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkspaceData) => workspacesApi.createWorkspace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

/**
 * Update workspace
 */
export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      data,
    }: {
      workspaceId: string;
      data: UpdateWorkspaceData;
    }) => workspacesApi.updateWorkspace(workspaceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspaces', variables.workspaceId],
      });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

/**
 * Delete workspace
 */
export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) => workspacesApi.deleteWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

/**
 * Invite member to workspace
 */
export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      data,
    }: {
      workspaceId: string;
      data: InviteMemberData;
    }) => workspacesApi.inviteMember(workspaceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspaces', variables.workspaceId, 'members'],
      });
    },
  });
}

/**
 * Update member role and permissions
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      userId,
      data,
    }: {
      workspaceId: string;
      userId: string;
      data: UpdateMemberRoleData;
    }) => workspacesApi.updateMemberRole(workspaceId, userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspaces', variables.workspaceId, 'members'],
      });
    },
  });
}

/**
 * Remove member from workspace
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      userId,
    }: {
      workspaceId: string;
      userId: string;
    }) => workspacesApi.removeMember(workspaceId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspaces', variables.workspaceId, 'members'],
      });
    },
  });
}

/**
 * Leave workspace
 */
export function useLeaveWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) => workspacesApi.leaveWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

/**
 * Generate invite link
 */
export function useGenerateInviteLink() {
  return useMutation({
    mutationFn: (workspaceId: string) =>
      workspacesApi.generateInviteLink(workspaceId),
  });
}

/**
 * Join workspace by invite code
 */
export function useJoinWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteCode: string) => workspacesApi.joinByInviteCode(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
