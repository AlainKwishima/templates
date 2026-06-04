import { requestData } from "@/lib/api/client";
import type { PublicUser } from "@/types/auth";
import type {
  UpdateProfileInput,
  UpdateUserRolesInput,
  UpdateUserStatusInput,
  UserListQuery,
  UserListResponse,
} from "@/types/users";

export async function getMe() {
  return requestData<{ user: PublicUser }>("/users/me", { method: "GET" });
}

export async function updateMe(data: UpdateProfileInput) {
  return requestData<{ user: PublicUser }>("/users/me", {
    method: "PATCH",
    body: data,
  });
}

export async function listUsers(query?: UserListQuery) {
  const searchParams = new URLSearchParams();
  if (query?.page) searchParams.set("page", String(query.page));
  if (query?.limit) searchParams.set("limit", String(query.limit));
  if (query?.search) searchParams.set("search", query.search);
  if (query?.role) searchParams.set("role", query.role);
  if (query?.status) searchParams.set("status", query.status);

  const qs = searchParams.toString();
  const url = qs ? `/users/admin?${qs}` : "/users/admin";
  return requestData<UserListResponse>(url, { method: "GET" });
}

export async function listRoles() {
  return requestData<{ roles: string[] }>("/users/admin/roles", { method: "GET" });
}

export async function updateUserStatus({ id, data }: { id: string; data: UpdateUserStatusInput }) {
  return requestData<{ user: PublicUser }>(`/users/admin/${id}/status`, {
    method: "PATCH",
    body: data,
  });
}

export async function updateUserRoles({ id, data }: { id: string; data: UpdateUserRolesInput }) {
  return requestData<{ user: PublicUser }>(`/users/admin/${id}/roles`, {
    method: "PATCH",
    body: data,
  });
}
