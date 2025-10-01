/**
 * Client-side video processing utilities for generating thumbnails and extracting metadata
 * Uses native browser APIs (Canvas, Video) - no server processing required
 */

export interface VideoMetadata {
  duration: number // seconds
  width: number
  height: number
  thumbnail: Blob // JPEG thumbnail image
  thumbnailDataUrl: string // Base64 data URL for preview
}

/**
 * Generate a thumbnail from a video file at the specified timestamp
 * @param videoFile - The video File object
 * @param timeOffset - Time in seconds to capture the frame (default: 1 second)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Promise with video metadata and thumbnail
 */
export async function generateVideoThumbnail(
  videoFile: File,
  timeOffset: number = 1,
  quality: number = 0.8
): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    // Create video element
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    // Create object URL from file
    const videoUrl = URL.createObjectURL(videoFile)

    // Clean up function
    const cleanup = () => {
      URL.revokeObjectURL(videoUrl)
      video.remove()
    }

    // Handle video load errors
    video.onerror = () => {
      cleanup()
      reject(new Error('Failed to load video'))
    }

    // When metadata is loaded, we can access duration and dimensions
    video.onloadedmetadata = () => {
      const duration = Math.floor(video.duration)
      const width = video.videoWidth
      const height = video.videoHeight

      // Validate dimensions
      if (!width || !height) {
        cleanup()
        reject(new Error('Invalid video dimensions'))
        return
      }

      // Seek to the desired timestamp (or middle if timestamp exceeds duration)
      const seekTime = Math.min(timeOffset, duration / 2)
      video.currentTime = seekTime
    }

    // When seeked to the desired frame, capture it
    video.onseeked = () => {
      try {
        // Create canvas with video dimensions
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          cleanup()
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              cleanup()
              reject(new Error('Failed to generate thumbnail'))
              return
            }

            // Also create a data URL for immediate preview
            const thumbnailDataUrl = canvas.toDataURL('image/jpeg', quality)

            cleanup()
            resolve({
              duration: Math.floor(video.duration),
              width: video.videoWidth,
              height: video.videoHeight,
              thumbnail: blob,
              thumbnailDataUrl
            })
          },
          'image/jpeg',
          quality
        )
      } catch (error) {
        cleanup()
        reject(error)
      }
    }

    // Load the video
    video.src = videoUrl
  })
}

/**
 * Get video metadata without generating a thumbnail
 * Useful for quick metadata extraction
 */
export async function getVideoMetadata(videoFile: File): Promise<{
  duration: number
  width: number
  height: number
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    const videoUrl = URL.createObjectURL(videoFile)

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl)
      video.remove()
      reject(new Error('Failed to load video'))
    }

    video.onloadedmetadata = () => {
      const metadata = {
        duration: Math.floor(video.duration),
        width: video.videoWidth,
        height: video.videoHeight
      }

      URL.revokeObjectURL(videoUrl)
      video.remove()
      resolve(metadata)
    }

    video.src = videoUrl
  })
}

/**
 * Create a thumbnail file from a video file
 * Returns a File object that can be uploaded like any other image
 */
export async function createVideoThumbnailFile(
  videoFile: File,
  timeOffset: number = 1,
  quality: number = 0.8
): Promise<{ thumbnailFile: File; metadata: VideoMetadata }> {
  const metadata = await generateVideoThumbnail(videoFile, timeOffset, quality)

  // Create a proper File object from the blob
  const thumbnailFileName = videoFile.name.replace(/\.[^/.]+$/, '') + '_thumbnail.jpg'
  const thumbnailFile = new File([metadata.thumbnail], thumbnailFileName, {
    type: 'image/jpeg',
    lastModified: Date.now()
  })

  return { thumbnailFile, metadata }
}

/**
 * Check if a file is a video
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/')
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
