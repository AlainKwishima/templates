import { requestData } from "@/lib/api/client";
import type { AuthPayload, LoginInput, RegisterInput } from "@/types/auth";

export async function login(input: LoginInput) {
  return requestData<AuthPayload>("/auth/login", {
    method: "POST",
    auth: false,
    body: input,
  });
}

export async function register(input: RegisterInput) {
  return requestData<AuthPayload>("/auth/register", {
    method: "POST",
    auth: false,
    body: input,
  });
}

export async function logout() {
  return requestData<{ loggedOut: boolean }>("/auth/logout", {
    method: "POST",
    auth: false,
    body: {},
  });
}

export async function requestPasswordReset(email: string) {
  return requestData<{ requested: boolean }>("/auth/forgot-password", {
    method: "POST",
    auth: false,
    body: { email },
  });
}

export async function resetPassword(token: string, password: string) {
  return requestData<{ reset: boolean }>("/auth/reset-password", {
    method: "POST",
    auth: false,
    body: { token, password },
  });
}

export async function verifyEmail(token: string) {
  return requestData<{ user: AuthPayload["user"] }>("/auth/verify-email", {
    method: "POST",
    auth: false,
    body: { token },
  });
}

export async function refreshSession() {
  return requestData<AuthPayload>("/auth/refresh", {
    method: "POST",
    auth: false,
    body: {},
  });
}

export async function getCurrentAuthUser() {
  return requestData<{ user: AuthPayload["user"] }>("/auth/me", {
    method: "GET",
  });
}
