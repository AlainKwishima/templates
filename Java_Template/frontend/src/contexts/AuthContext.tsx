import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, userApi } from '@/api';
import type { AuthResponse, Role, User } from '@/api/types';
import { ROLES } from '@/constants';
import {
  clearAuthStorage,
  getAccessToken,
  getStoredUserEmail,
  getStoredUserRole,
  isTokenExpired,
  saveAuthTokens,
  saveUserMeta,
} from '@/utils/storage';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (data: Parameters<typeof authApi.register>[0]) => Promise<AuthResponse>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function applyAuthResponse(response: AuthResponse) {
  saveAuthTokens(response.accessToken, response.refreshToken, response.expiresIn);
  saveUserMeta(response.email, response.role);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const profile = await userApi.getMe();
    setUser(profile);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      const token = getAccessToken();
      if (!token || isTokenExpired()) {
        clearAuthStorage();
        setIsLoading(false);
        return;
      }

      try {
        await refreshProfile();
      } catch {
        clearAuthStorage();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void bootstrap();
  }, [refreshProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    applyAuthResponse(response);
    await refreshProfile();
    return response;
  }, [refreshProfile]);

  const register = useCallback(async (data: Parameters<typeof authApi.register>[0]) => {
    const response = await authApi.register(data);
    applyAuthResponse(response);
    await refreshProfile();
    return response;
  }, [refreshProfile]);

  const logout = useCallback(() => {
    clearAuthStorage();
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]) => {
      const role = user?.role ?? (getStoredUserRole() as Role | null);
      return role ? roles.includes(role) : false;
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user) || (Boolean(getAccessToken()) && !isTokenExpired()),
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
      hasRole,
      isAdmin: hasRole(ROLES.ADMIN),
    }),
    [user, isLoading, login, register, logout, refreshProfile, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useAuthEmail(): string | null {
  const { user } = useAuth();
  return user?.email ?? getStoredUserEmail();
}
