import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import {
  deleteFile,
  getFile,
  listFiles,
  updateFile,
  uploadFile,
} from "@/features/files/files.api";
import type { ListFilesQuery } from "@/types/files";

export function useListFilesQuery(query?: ListFilesQuery) {
  return useQuery({
    queryKey: queryKeys.files.list(query as Record<string, unknown>),
    queryFn: () => listFiles(query),
  });
}

export function useGetFileQuery(id: string) {
  return useQuery({
    queryKey: [...queryKeys.files.root, id],
    queryFn: () => getFile(id),
    enabled: Boolean(id),
  });
}

export function useUpdateFileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFile,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.list() });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.files.root, variables.id] });
    },
  });
}

export function useDeleteFileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.list() });
    },
  });
}

export function useUploadFileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.list() });
    },
  });
}
