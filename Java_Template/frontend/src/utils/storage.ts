import { STORAGE_KEYS } from '@/constants';

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function getTokenExpiry(): number | null {
  const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  return expiry ? Number(expiry) : null;
}

export function isTokenExpired(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  return Date.now() >= expiry;
}

export function saveAuthTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
  const expiryTime = Date.now() + expiresIn * 1000;
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, String(expiryTime));
}

export function saveUserMeta(email: string, role: string): void {
  localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
  localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
}

export function clearAuthStorage(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
  localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
}

export function getStoredUserRole(): string | null {
  return localStorage.getItem(STORAGE_KEYS.USER_ROLE);
}

export function getStoredUserEmail(): string | null {
  return localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
}

export type Theme = 'light' | 'dark';

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEYS.THEME);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}
