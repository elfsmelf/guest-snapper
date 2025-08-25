// Client-side upload utilities for XHR with progress and concurrency control

export function xhrPut(
  url: string,
  blob: Blob,
  {
    headers = {},
    onProgress,
    signal,
  }: {
    headers?: Record<string, string>;
    onProgress?: (loaded: number, total: number) => void;
    signal?: AbortSignal;
  } = {}
): Promise<{ etag?: string; status: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);

    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

    let lastProgress = 0;
    
    xhr.upload.onloadstart = () => {
      console.log('🚀 XHR Upload started for blob size:', blob.size) // Debug
      if (onProgress) {
        onProgress(0, blob.size);
        lastProgress = 0;
      }
    };

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.floor((e.loaded / e.total) * 100);
        // Only log if progress changed by at least 5% to reduce spam
        if (percent - lastProgress >= 5 || percent === 100) {
          console.log(`📊 XHR Progress: ${e.loaded}/${e.total} (${percent}%)`) // Debug
          lastProgress = percent;
        }
        onProgress(e.loaded, e.total);
      } else {
        console.log('⚠️ XHR Progress event not lengthComputable or no callback', { 
          lengthComputable: e.lengthComputable, 
          hasCallback: !!onProgress,
          loaded: e.loaded,
          total: e.total 
        }) // Debug
      }
    };
    
    xhr.upload.onload = () => {
      console.log('✅ XHR Upload onload event fired') // Debug
      if (onProgress) onProgress(blob.size, blob.size);
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        const etag = xhr.getResponseHeader("ETag") || undefined;
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ etag, status: xhr.status });
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.onabort = () => reject(new Error("Aborted"));

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
      } else {
        signal.addEventListener("abort", () => xhr.abort(), { once: true });
      }
    }

    xhr.send(blob);
  });
}

export function pLimit(concurrency: number) {
  let active = 0;
  const queue: (() => void)[] = [];

  const next = () => {
    active--;
    if (queue.length) {
      const fn = queue.shift()!;
      fn();
    }
  };

  return function <T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = () => {
        active++;
        fn().then(
          (v) => {
            next();
            resolve(v);
          },
          (e) => {
            next();
            reject(e);
          }
        );
      };
      if (active < concurrency) run();
      else queue.push(run);
    });
  };
}

export function normalizeEtag(etag?: string) {
  if (!etag) return "";
  // Ensure quotes are present for S3 CompleteMultipartUpload
  if (!/^".*"$/.test(etag)) return `"${etag}"`;
  return etag;
}

// Types for upload progress and results
export type UploadProgress = {
  totalBytes: number;
  uploadedBytes: number;
  percent: number; // 0..100 (integer)
};

export type PartResult = { PartNumber: number; ETag: string };