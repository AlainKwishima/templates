import {
  serviceFetch,
  type PublicUser,
  type UserAuthContext,
} from "@restful/shared";
import { env } from "@/config/env.js";

const clientOptions = {
  baseUrl: env.USER_SERVICE_URL,
  serviceKey: env.INTERNAL_SERVICE_KEY,
};

export const userServiceClient = {
  createUser(input: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }) {
    return serviceFetch<{ user: PublicUser }>(clientOptions, "/internal/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  getAuthContext(userId: string) {
    return serviceFetch<UserAuthContext>(clientOptions, `/internal/users/${userId}/auth-context`);
  },

  getAuthContextByEmail(email: string) {
    return serviceFetch<UserAuthContext>(
      clientOptions,
      `/internal/users/by-email/${encodeURIComponent(email)}/auth-context`,
    );
  },

  updateAccountState(
    userId: string,
    input: { isEmailVerified?: boolean; status?: "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED" },
  ) {
    return serviceFetch<{ user: PublicUser }>(clientOptions, `/internal/users/${userId}/account-state`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  recordLastLogin(userId: string) {
    return serviceFetch<{ recorded: boolean }>(clientOptions, `/internal/users/${userId}/last-login`, {
      method: "POST",
    });
  },
};
