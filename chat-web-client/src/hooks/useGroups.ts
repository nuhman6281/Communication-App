/**
 * Groups Hooks
 * React hooks for group management with TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '@/lib/api/endpoints';
import { queryKeys, invalidateQueries } from '@/lib/query-client';
import type { CreateGroupRequest, UpdateGroupRequest, UpdateGroupMemberRoleRequest, PaginationParams } from '@/types/api.types';

export function useGroups(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.groups.all(params),
    queryFn: () => groupsApi.getAll(params),
    staleTime: 1 * 60 * 1000,
  });
}

export function useGroup(id: string | null) {
  return useQuery({
    queryKey: queryKeys.groups.detail(id!),
    queryFn: () => groupsApi.getById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useGroupMembers(id: string | null, params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.groups.members(id!, params),
    queryFn: () => groupsApi.getMembers(id!, params),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGroupRequest) => groupsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all() });
    },
    meta: {
      successMessage: 'Group created successfully',
      errorMessage: 'Failed to create group',
    },
  });
}

export function useUpdateGroup() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupRequest }) =>
      groupsApi.update(id, data),
    onSuccess: async (_, { id }) => {
      await invalidateQueries.group(id);
    },
    meta: {
      successMessage: 'Group updated successfully',
      errorMessage: 'Failed to update group',
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => groupsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.groups.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all() });
    },
    meta: {
      successMessage: 'Group deleted successfully',
      errorMessage: 'Failed to delete group',
    },
  });
}

export function useAddGroupMembers() {
  return useMutation({
    mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
      groupsApi.addMembers(id, userIds),
    onSuccess: async (_, { id }) => {
      await invalidateQueries.group(id);
    },
    meta: {
      successMessage: 'Members added successfully',
      errorMessage: 'Failed to add members',
    },
  });
}

export function useRemoveGroupMember() {
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      groupsApi.removeMember(id, userId),
    onSuccess: async (_, { id }) => {
      await invalidateQueries.group(id);
    },
    meta: {
      successMessage: 'Member removed successfully',
      errorMessage: 'Failed to remove member',
    },
  });
}

export function useUpdateGroupMemberRole() {
  return useMutation({
    mutationFn: ({ groupId, userId, data }: { groupId: string; userId: string; data: UpdateGroupMemberRoleRequest }) =>
      groupsApi.updateMemberRole(groupId, userId, data),
    onSuccess: async (_, { groupId }) => {
      await invalidateQueries.group(groupId);
    },
    meta: {
      successMessage: 'Member role updated',
      errorMessage: 'Failed to update member role',
    },
  });
}
