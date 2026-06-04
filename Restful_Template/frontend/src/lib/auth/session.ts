import { env } from "@/config/env";
import type { AuthSession, PublicUser, TokenPair } from "@/types/auth";

const storageKey = `${env.VITE_STORAGE_PREFIX}.auth.session`;

let currentSession: AuthSession | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function loadStoredSession(): AuthSession | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.sessionStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.sessionStorage.removeItem(storageKey);
    return null;
  }
}

function persistSession(session: AuthSession | null) {
  if (!canUseStorage()) {
    return;
  }

  if (session) {
    window.sessionStorage.setItem(storageKey, JSON.stringify(session));
  } else {
    window.sessionStorage.removeItem(storageKey);
  }
}

currentSession ??= loadStoredSession();

export function getAuthSession() {
  return currentSession;
}

export function getAccessToken() {
  return currentSession?.tokens.accessToken ?? null;
}

export function getCurrentUser() {
  return currentSession?.user ?? null;
}

export function setAuthSession(session: AuthSession | null) {
  currentSession = session;
  persistSession(session);
  notify();
}

export function updateAuthSession(updater: (session: AuthSession | null) => AuthSession | null) {
  setAuthSession(updater(currentSession));
}

export function clearAuthSession() {
  setAuthSession(null);
}

export function subscribeAuthSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function createAuthSession(user: PublicUser, tokens: TokenPair): AuthSession {
  return { user, tokens };
}
