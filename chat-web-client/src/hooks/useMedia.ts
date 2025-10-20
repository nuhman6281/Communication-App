/**
 * Media/Files Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/query-client';
import { useState } from 'react';
import type { PaginationParams } from '@/types/api.types';

export function useMedia(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.media.mine(params),
    queryFn: () => mediaApi.getMyFiles(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: (file: File) =>
      mediaApi.upload(file, (percent) => setUploadProgress(percent)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.media.mine() });
      setUploadProgress(0);
    },
    onError: () => setUploadProgress(0),
    meta: { successMessage: 'File uploaded successfully', errorMessage: 'Failed to upload file' },
  });

  return { ...mutation, uploadProgress };
}

export function useMediaStats() {
  return useQuery({
    queryKey: queryKeys.media.stats,
    queryFn: mediaApi.getStats,
    staleTime: 5 * 60 * 1000,
  });
}
