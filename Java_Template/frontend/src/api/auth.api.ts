import { apiClient, unwrap } from './client';
import type {
  ApiResponse,
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from './types';

const AUTH_BASE = '/api/v1/auth';

export const authApi = {
  register(data: RegisterRequest) {
    return unwrap(
      apiClient.post<ApiResponse<AuthResponse>>(`${AUTH_BASE}/register`, data),
    );
  },

  login(data: LoginRequest) {
    return unwrap(apiClient.post<ApiResponse<AuthResponse>>(`${AUTH_BASE}/login`, data));
  },

  forgotPassword(data: ForgotPasswordRequest) {
    return unwrap(apiClient.post<ApiResponse<null>>(`${AUTH_BASE}/forgot-password`, data));
  },

  resetPassword(data: ResetPasswordRequest) {
    return unwrap(apiClient.post<ApiResponse<null>>(`${AUTH_BASE}/reset-password`, data));
  },

  verifyEmail(token: string) {
    return unwrap(
      apiClient.get<ApiResponse<null>>(`${AUTH_BASE}/verify-email`, { params: { token } }),
    );
  },

  resendVerification(data: ForgotPasswordRequest) {
    return unwrap(
      apiClient.post<ApiResponse<null>>(`${AUTH_BASE}/resend-verification`, data),
    );
  },
};
