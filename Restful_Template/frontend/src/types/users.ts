import type { PublicUser } from "@/types/auth";

export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface UserListResponse {
  users: PublicUser[];
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface UpdateUserStatusInput {
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
}

export interface UpdateUserRolesInput {
  roles: string[];
}
