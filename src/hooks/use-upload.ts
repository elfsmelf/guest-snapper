"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { xhrPut, pLimit, normalizeEtag, type UploadProgress, type PartResult } from "@/lib/upload-utils";
import { uploadKeys } from "./use-onboarding";

// Single-part upload mutation with progress
type SingleUploadInput = {
  eventId: string;
  file: File;
  fileName?: string;
  uploaderName?: string;
  caption?: string;
  albumId?: string;
  onProgress?: (p: UploadProgress) => void;
};

export function useSingleUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      file, 
      fileName, 
      uploaderName,
      caption,
      albumId,
      onProgress 
    }: SingleUploadInput) => {
      const controller = new AbortController();
      const startTime = Date.now();
      
      console.log(`Starting single upload for ${file.name} (${file.size} bytes)`) // Debug

      // 1) Get presigned URL
      onProgress?.({ totalBytes: file.size, uploadedBytes: 0, percent: 0 });
      const { uploadUrl, fileKey, fileUrl } = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          eventId, 
          fileName: fileName || file.name, 
          fileType: file.type,
          fileSize: file.size 
        }),
        signal: controller.signal,
      }).then((r) => {
        if (!r.ok) throw new Error(`Failed to get upload URL: ${r.status}`);
        return r.json();
      });

      console.log(`Got presigned URL for ${file.name}`) // Debug

      // 2) Upload with progress
      let uploadedBytes = 0;
      await xhrPut(uploadUrl, file, {
        headers: { "Content-Type": file.type || "application/octet-stream" },
        signal: controller.signal,
        onProgress: (loaded, total) => {
          uploadedBytes = loaded;
          const progress = {
            totalBytes: total,
            uploadedBytes,
            percent: Math.floor((uploadedBytes / total) * 100),
          };
          console.log(`Single upload progress for ${file.name}:`, progress) // Debug
          onProgress?.(progress);
        },
      });

      console.log(`Upload to R2 completed for ${file.name}`) // Debug

      // 3) Save metadata to database (do this immediately after upload)
      const dbResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          albumId: albumId || null,
          uploaderName: uploaderName || null,
          caption: caption || null,
          fileName: fileName || file.name,
          fileSize: file.size,
          fileType: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'video',
          fileKey,
          fileUrl,
          mimeType: file.type
        })
      });

      const dbResult = await dbResponse.json();

      if (!dbResult.success) {
        throw new Error(dbResult.error || 'Failed to save upload metadata');
      }

      const totalTime = Date.now() - startTime;
      const speedMBps = (file.size / (1024 * 1024)) / (totalTime / 1000);
      console.log(`✅ Upload completed for ${file.name} in ${totalTime}ms (${speedMBps.toFixed(2)} MB/s)`) // Debug

      return { fileKey, fileUrl, upload: dbResult.upload };
    },
    onSuccess: (data, variables) => {
      // Invalidate upload count to update UI immediately
      queryClient.invalidateQueries({ queryKey: uploadKeys.count(variables.eventId) });
    }
  });
}

// Multipart upload mutation for large files
type MultipartUploadInput = {
  eventId: string;
  file: File;
  fileName?: string;
  uploaderName?: string;
  caption?: string;
  albumId?: string;
  // Optional tuning
  concurrency?: number;
  onProgress?: (p: UploadProgress) => void;
  onPartDone?: (partNumber: number) => void;
};

export function useMultipartUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      file,
      fileName,
      uploaderName,
      caption,
      albumId,
      concurrency = 4,
      onProgress,
      onPartDone,
    }: MultipartUploadInput) => {
      const controller = new AbortController();
      const contentType = file.type || "application/octet-stream";

      // 1) Initiate multipart upload
      const { uploadId, fileKey, fileUrl, partSize } = await fetch("/api/multipart/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          eventId, 
          fileName: fileName || file.name, 
          fileType: contentType, 
          fileSize: file.size 
        }),
        signal: controller.signal,
      }).then((r) => {
        if (!r.ok) throw new Error(`Failed to initiate upload: ${r.status}`);
        return r.json();
      });

      // 2) Build parts by server-provided partSize
      type PartInfo = { partNumber: number; start: number; end: number };
      const parts: PartInfo[] = [];
      let pn = 1;
      for (let start = 0; start < file.size; start += partSize) {
        const end = Math.min(start + partSize, file.size);
        parts.push({ partNumber: pn++, start, end });
      }

      // 3) Request presigned URLs for all parts
      const { urls } = await fetch("/api/multipart/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileKey,
          uploadId,
          partNumbers: parts.map((p) => p.partNumber),
        }),
        signal: controller.signal,
      }).then((r) => {
        if (!r.ok) throw new Error(`Failed to get part URLs: ${r.status}`);
        return r.json();
      });

      const urlMap = new Map<number, string>(urls.map((u: any) => [u.partNumber, u.url]));

      // 4) Upload with concurrency and accurate progress
      const totalBytes = file.size;
      const sentByPart = new Map<number, number>();
      let uploaded = 0;

      const updateProgress = (pn: number, loaded: number, partTotal: number) => {
        // Cap by part size to avoid overshoot
        const capped = Math.min(loaded, partTotal);
        sentByPart.set(pn, capped);
        uploaded = 0;
        for (const v of sentByPart.values()) uploaded += v;
        onProgress?.({
          totalBytes,
          uploadedBytes: uploaded,
          percent: Math.floor((uploaded / totalBytes) * 100),
        });
      };

      const limit = pLimit(concurrency);
      const results: PartResult[] = [];

      try {
        await Promise.all(
          parts.map((p) =>
            limit(async () => {
              const blob = file.slice(p.start, p.end);
              const url = urlMap.get(p.partNumber)!;

              const maxRetries = 3;
              let attempt = 0;
              // Retry loop
              while (true) {
                try {
                  const res = await xhrPut(url, blob, {
                    headers: { "Content-Type": contentType },
                    signal: controller.signal,
                    onProgress: (loaded) => updateProgress(p.partNumber, loaded, blob.size),
                  });
                  results.push({
                    PartNumber: p.partNumber,
                    ETag: normalizeEtag(res.etag),
                  });
                  onPartDone?.(p.partNumber);
                  break;
                } catch (e) {
                  attempt++;
                  if (attempt > maxRetries) throw e;
                  await new Promise((r) => setTimeout(r, 500 * attempt));
                }
              }
            })
          )
        );

        // 5) Complete multipart upload
        const complete = await fetch("/api/multipart/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileKey,
            uploadId,
            parts: results.sort((a, b) => a.PartNumber - b.PartNumber),
          }),
          signal: controller.signal,
        });

        if (!complete.ok) {
          throw new Error("CompleteMultipartUpload failed");
        }

        // 6) Save metadata to database
        const dbResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            albumId: albumId || null,
            uploaderName: uploaderName || null,
            caption: caption || null,
            fileName: fileName || file.name,
            fileSize: file.size,
            fileType: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'video',
            fileKey,
            fileUrl,
            mimeType: file.type
          })
        });

        const dbResult = await dbResponse.json();

        if (!dbResult.success) {
          throw new Error(dbResult.error || 'Failed to save upload metadata');
        }

        onProgress?.({ totalBytes, uploadedBytes: totalBytes, percent: 100 });
        return { fileKey, fileUrl, uploadId, upload: dbResult.upload };

      } catch (error) {
        // Abort multipart upload on error
        try {
          await fetch("/api/multipart/abort", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileKey, uploadId }),
          });
        } catch (abortError) {
          console.error("Failed to abort multipart upload:", abortError);
        }
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate upload count to update UI immediately
      queryClient.invalidateQueries({ queryKey: uploadKeys.count(variables.eventId) });
    }
  });
}

// Smart upload hook that chooses single-part or multipart based on file size
const MULTIPART_THRESHOLD = 10 * 1024 * 1024; // 10MB (lowered for testing)

export function useSmartUpload() {
  const singleUpload = useSingleUpload();
  const multipartUpload = useMultipartUpload();

  return useMutation({
    mutationFn: async (input: SingleUploadInput) => {
      if (input.file.size > MULTIPART_THRESHOLD) {
        return multipartUpload.mutateAsync(input as MultipartUploadInput);
      } else {
        return singleUpload.mutateAsync(input);
      }
    },
    meta: {
      // Expose the underlying mutation states for UI
      getSingleUpload: () => singleUpload,
      getMultipartUpload: () => multipartUpload,
    }
  });
}

// Batch upload hook for multiple files with global concurrency control
type BatchUploadInput = {
  eventId: string;
  files: Array<{
    id: string;
    file: File;
    fileName?: string;
    caption?: string;
    albumId?: string;
  }>;
  uploaderName?: string;
  globalConcurrency?: number; // Max concurrent files
  onFileProgress?: (fileId: string, progress: UploadProgress) => void;
  onFileComplete?: (fileId: string, result: any) => void;
  onOverallProgress?: (completed: number, total: number) => void;
};

export function useBatchUpload() {
  const queryClient = useQueryClient();
  const smartUpload = useSmartUpload();

  return useMutation({
    mutationFn: async ({ 
      eventId,
      files, 
      uploaderName,
      globalConcurrency = 3,
      onFileProgress,
      onFileComplete,
      onOverallProgress
    }: BatchUploadInput) => {
      let completed = 0;
      const total = files.length;

      const limit = pLimit(globalConcurrency);
      const results: Array<{ id: string; success: boolean; result?: any; error?: string }> = [];

      await Promise.all(
        files.map(({ id, file, fileName, caption, albumId }) =>
          limit(async () => {
            try {
              const result = await smartUpload.mutateAsync({
                eventId,
                file,
                fileName,
                caption,
                albumId,
                uploaderName,
                onProgress: (progress) => onFileProgress?.(id, progress)
              });

              results.push({ id, success: true, result });
              onFileComplete?.(id, result);
            } catch (error) {
              results.push({ 
                id, 
                success: false, 
                error: error instanceof Error ? error.message : 'Upload failed' 
              });
              onFileComplete?.(id, { error });
            } finally {
              completed++;
              onOverallProgress?.(completed, total);
            }
          })
        )
      );

      const successfulUploads = results.filter(r => r.success).length;
      return { results, successfulUploads, totalFiles: total };
    },
    onSuccess: (data, variables) => {
      // Invalidate upload count to update UI immediately
      queryClient.invalidateQueries({ queryKey: uploadKeys.count(variables.eventId) });
    }
  });
}