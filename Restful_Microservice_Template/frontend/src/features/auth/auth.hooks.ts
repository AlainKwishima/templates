import { useMutation, useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { queryKeys } from "@/lib/query/keys";
import { subscribeAuthSession, getAuthSession, setAuthSession, clearAuthSession } from "@/lib/auth/session";
import { bootstrapAuthSession } from "@/lib/auth/bootstrap";
import { login, logout, register, getCurrentAuthUser } from "@/features/auth/auth.api";

export function useAuthSession() {
  return useSyncExternalStore(subscribeAuthSession, getAuthSession, getAuthSession);
}

export function useBootstrapAuthSession() {
  return useMutation({
    mutationFn: bootstrapAuthSession,
  });
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: login,
    onSuccess: (payload) => {
      setAuthSession(payload);
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: register,
    onSuccess: (payload) => {
      setAuthSession(payload);
    },
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearAuthSession();
    },
  });
}

export function useCurrentAuthUserQuery() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: getCurrentAuthUser,
    enabled: Boolean(getAuthSession()?.tokens.accessToken),
  });
}
