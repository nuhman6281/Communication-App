import { apiClient } from '../client';
import type {
  Workspace,
  WorkspaceMember,
  CreateWorkspaceData,
  UpdateWorkspaceData,
  InviteMemberData,
  UpdateMemberRoleData,
  WorkspaceListResponse,
  WorkspaceMembersResponse,
  InviteLinkResponse,
  JoinWorkspaceResponse,
  WorkspaceGroupsResponse,
  WorkspaceChannelsResponse,
} from '@/types/entities.types';

export const workspacesApi = {
  // ========================================
  // WORKSPACE CRUD
  // ========================================

  /**
   * Create a new workspace
   */
  createWorkspace: async (data: CreateWorkspaceData): Promise<Workspace> => {
    const response = await apiClient.post<Workspace>('/workspaces', data);
    return response.data;
  },

  /**
   * Get all workspaces for current user
   */
  getWorkspaces: async (params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    onlyOwned?: boolean;
  }): Promise<WorkspaceListResponse> => {
    const response = await apiClient.get<WorkspaceListResponse>('/workspaces', {
      params,
    });
    return response.data;
  },

  /**
   * Get workspace by ID
   */
  getWorkspace: async (workspaceId: string): Promise<Workspace> => {
    const response = await apiClient.get<Workspace>(`/workspaces/${workspaceId}`);
    return response.data;
  },

  /**
   * Update workspace
   */
  updateWorkspace: async (
    workspaceId: string,
    data: UpdateWorkspaceData,
  ): Promise<Workspace> => {
    const response = await apiClient.patch<Workspace>(
      `/workspaces/${workspaceId}`,
      data,
    );
    return response.data;
  },

  /**
   * Delete workspace (owner only)
   */
  deleteWorkspace: async (workspaceId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/workspaces/${workspaceId}`,
    );
    return response.data;
  },

  // ========================================
  // MEMBER MANAGEMENT
  // ========================================

  /**
   * Get workspace members
   */
  getWorkspaceMembers: async (
    workspaceId: string,
    params?: {
      page?: number;
      limit?: number;
      role?: string;
      status?: string;
    },
  ): Promise<WorkspaceMembersResponse> => {
    const response = await apiClient.get<WorkspaceMembersResponse>(
      `/workspaces/${workspaceId}/members`,
      { params },
    );
    return response.data;
  },

  /**
   * Invite member by email
   */
  inviteMember: async (
    workspaceId: string,
    data: InviteMemberData,
  ): Promise<{ message: string; invitation: WorkspaceMember }> => {
    const response = await apiClient.post<{
      message: string;
      invitation: WorkspaceMember;
    }>(`/workspaces/${workspaceId}/members/invite`, data);
    return response.data;
  },

  /**
   * Add member directly (without email)
   */
  addMemberDirect: async (
    workspaceId: string,
    data: { userId: string; role?: string; customPermissions?: string[] },
  ): Promise<WorkspaceMember> => {
    const response = await apiClient.post<WorkspaceMember>(
      `/workspaces/${workspaceId}/members`,
      data,
    );
    return response.data;
  },

  /**
   * Update member role and permissions
   */
  updateMemberRole: async (
    workspaceId: string,
    userId: string,
    data: UpdateMemberRoleData,
  ): Promise<WorkspaceMember> => {
    const response = await apiClient.patch<WorkspaceMember>(
      `/workspaces/${workspaceId}/members/${userId}`,
      data,
    );
    return response.data;
  },

  /**
   * Remove member from workspace
   */
  removeMember: async (
    workspaceId: string,
    userId: string,
  ): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/workspaces/${workspaceId}/members/${userId}`,
    );
    return response.data;
  },

  /**
   * Leave workspace
   */
  leaveWorkspace: async (workspaceId: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      `/workspaces/${workspaceId}/leave`,
    );
    return response.data;
  },

  // ========================================
  // INVITATIONS
  // ========================================

  /**
   * Generate invite link
   */
  generateInviteLink: async (workspaceId: string): Promise<InviteLinkResponse> => {
    const response = await apiClient.post<InviteLinkResponse>(
      `/workspaces/${workspaceId}/invite/generate`,
    );
    return response.data;
  },

  /**
   * Join workspace by invite code
   */
  joinByInviteCode: async (inviteCode: string): Promise<JoinWorkspaceResponse> => {
    const response = await apiClient.get<JoinWorkspaceResponse>(
      `/workspaces/join/${inviteCode}`,
    );
    return response.data;
  },

  // ========================================
  // WORKSPACE RESOURCES
  // ========================================

  /**
   * Get workspace channels
   */
  getWorkspaceChannels: async (
    workspaceId: string,
    params?: { page?: number; limit?: number },
  ): Promise<WorkspaceChannelsResponse> => {
    const response = await apiClient.get<WorkspaceChannelsResponse>(
      `/workspaces/${workspaceId}/channels`,
      { params },
    );
    return response.data;
  },

  /**
   * Get workspace groups
   */
  getWorkspaceGroups: async (
    workspaceId: string,
    params?: { page?: number; limit?: number },
  ): Promise<WorkspaceGroupsResponse> => {
    const response = await apiClient.get<WorkspaceGroupsResponse>(
      `/workspaces/${workspaceId}/groups`,
      { params },
    );
    return response.data;
  },

  // ========================================
  // PERMISSIONS
  // ========================================

  /**
   * Check if user has a specific permission
   */
  checkPermission: async (
    workspaceId: string,
    permission: string,
  ): Promise<{ hasPermission: boolean }> => {
    const response = await apiClient.get<{ hasPermission: boolean }>(
      `/workspaces/${workspaceId}/permissions/${permission}`,
    );
    return response.data;
  },

  /**
   * Get user's role in workspace
   */
  getMyRole: async (workspaceId: string): Promise<{ role: string }> => {
    const response = await apiClient.get<{ role: string }>(
      `/workspaces/${workspaceId}/role`,
    );
    return response.data;
  },
};
