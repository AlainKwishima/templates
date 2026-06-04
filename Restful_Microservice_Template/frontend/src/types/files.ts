export interface FileRecord {
  id: string;
  userId: string | null;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  storage: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ListFilesQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface UpdateFileInput {
  originalName: string;
}
