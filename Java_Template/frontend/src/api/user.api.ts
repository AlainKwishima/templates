import { apiClient, unwrap } from './client';
import type {
  ApiResponse,
  PageResponse,
  UpdatePasswordRequest,
  UpdateProfileRequest,
  UpdateRoleRequest,
  User,
  UserListParams,
} from './types';

const USERS_BASE = '/api/v1/users';

export const userApi = {
  getMe() {
    return unwrap(apiClient.get<ApiResponse<User>>(`${USERS_BASE}/me`));
  },

  updateMe(data: UpdateProfileRequest) {
    return unwrap(apiClient.patch<ApiResponse<User>>(`${USERS_BASE}/me`, data));
  },

  updatePassword(data: UpdatePasswordRequest) {
    return unwrap(apiClient.patch<ApiResponse<null>>(`${USERS_BASE}/me/password`, data));
  },

  getAll(params: UserListParams = {}) {
    return unwrap(
      apiClient.get<ApiResponse<PageResponse<User>>>(USERS_BASE, { params }),
    );
  },

  getById(id: number) {
    return unwrap(apiClient.get<ApiResponse<User>>(`${USERS_BASE}/${id}`));
  },

  updateRole(id: number, data: UpdateRoleRequest) {
    return unwrap(apiClient.patch<ApiResponse<User>>(`${USERS_BASE}/${id}/role`, data));
  },

  deactivate(id: number) {
    return unwrap(apiClient.patch<ApiResponse<User>>(`${USERS_BASE}/${id}/deactivate`));
  },

  activate(id: number) {
    return unwrap(apiClient.patch<ApiResponse<User>>(`${USERS_BASE}/${id}/activate`));
  },
};
