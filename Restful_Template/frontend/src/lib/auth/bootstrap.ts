import { requestData } from "@/lib/api/client";
import { clearAuthSession, createAuthSession, getAuthSession, setAuthSession } from "@/lib/auth/session";
import type { AuthPayload } from "@/types/auth";

let bootstrapped = false;
let bootstrapping: Promise<AuthPayload | null> | null = null;

export async function refreshAuthSession() {
  const response = await requestData<{ user: AuthPayload["user"]; tokens: AuthPayload["tokens"] }>("/auth/refresh", {
    method: "POST",
    auth: false,
    body: {},
  });

  const session = createAuthSession(response.user, response.tokens);
  setAuthSession(session);
  return session;
}

export async function bootstrapAuthSession() {
  if (bootstrapped && getAuthSession()) {
    return getAuthSession();
  }

  if (bootstrapping) {
    return bootstrapping;
  }

  bootstrapping = (async () => {
    try {
      const existing = getAuthSession();
      if (existing) {
        bootstrapped = true;
        return existing;
      }

      const session = await refreshAuthSession();
      bootstrapped = true;
      return session;
    } catch {
      clearAuthSession();
      bootstrapped = true;
      return null;
    } finally {
      bootstrapping = null;
    }
  })();

  return bootstrapping;
}
