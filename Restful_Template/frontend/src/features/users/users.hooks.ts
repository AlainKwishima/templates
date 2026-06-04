import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import {
  getMe,
  listRoles,
  listUsers,
  updateMe,
  updateUserRoles,
  updateUserStatus,
} from "@/features/users/users.api";
import type { UserListQuery } from "@/types/users";

export function useMeQuery() {
  return useQuery({
    queryKey: queryKeys.users.me,
    queryFn: getMe,
  });
}

export function useUpdateMeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}

export function useListUsersQuery(query?: UserListQuery) {
  return useQuery({
    queryKey: queryKeys.users.list(query as Record<string, unknown>),
    queryFn: () => listUsers(query),
  });
}

export function useListRolesQuery() {
  return useQuery({
    queryKey: queryKeys.users.roles,
    queryFn: listRoles,
  });
}

export function useUpdateUserStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.list() });
    },
  });
}

export function useUpdateUserRolesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserRoles,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.list() });
    },
  });
}
