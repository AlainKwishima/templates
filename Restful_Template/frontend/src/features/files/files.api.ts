import { requestData } from "@/lib/api/client";
import type { FileRecord, ListFilesQuery, UpdateFileInput } from "@/types/files";

export async function listFiles(query?: ListFilesQuery) {
  const searchParams = new URLSearchParams();
  if (query?.page) searchParams.set("page", String(query.page));
  if (query?.limit) searchParams.set("limit", String(query.limit));
  if (query?.search) searchParams.set("search", query.search);

  const qs = searchParams.toString();
  const url = qs ? `/files?${qs}` : "/files";
  return requestData<{ files: FileRecord[] }>(url, { method: "GET" });
}

export async function getFile(id: string) {
  return requestData<{ file: FileRecord }>(`/files/${id}`, { method: "GET" });
}

export async function updateFile({ id, data }: { id: string; data: UpdateFileInput }) {
  return requestData<{ file: FileRecord }>(`/files/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteFile(id: string) {
  return requestData<{ deleted: boolean }>(`/files/${id}`, { method: "DELETE" });
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return requestData<{ file: FileRecord }>("/files/upload", {
    method: "POST",
    body: formData,
  });
}
