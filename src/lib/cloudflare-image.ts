/**
 * Cloudflare Image Resizing URL builder
 * Strategy: ONE optimized transformation per image to minimize costs
 * - Original stored in R2
 * - Single optimized version served via Cloudflare (auto WebP/AVIF)
 */

// Single optimized configuration for all images
// This minimizes unique transformations to just 1 per image
const OPTIMIZED_CONFIG = {
  width: 1920,      // Max width that covers most screens (4K displays will upscale slightly)
  quality: 80,      // Good quality/size balance
  format: 'auto',   // Let Cloudflare choose WebP/AVIF based on browser
  fit: 'scale-down' // Never upscale, only downscale if needed
} as const

/**
 * Get the single optimized version of any image
 * This ensures we only create ONE transformation per unique image
 * @param src - Original image URL (must be from assets.guestsnapper.com)
 * @returns Single optimized image URL
 */
export function getOptimizedImageUrl(src: string): string {
  // Skip transformation for non-image URLs or external URLs
  if (!src || !isTransformableImage(src)) {
    return src
  }

  // Extract the path from the full URL if needed
  const imagePath = extractImagePath(src)
  
  // Build the single transformation URL with consistent parameters
  // This ensures the same image always gets the same transformation
  const params = `width=${OPTIMIZED_CONFIG.width},quality=${OPTIMIZED_CONFIG.quality},format=${OPTIMIZED_CONFIG.format},fit=${OPTIMIZED_CONFIG.fit}`
  
  // Return the transformed URL
  return `https://assets.guestsnapper.com/cdn-cgi/image/${params}/${imagePath}`
}

/**
 * Get original image URL (bypass transformations)
 * Use this for download links or when you need the original
 */
export function getOriginalImageUrl(src: string): string {
  // Just return the direct R2 URL without transformations
  if (src.includes('/cdn-cgi/image/')) {
    // Extract original from transformed URL
    const match = src.match(/\/cdn-cgi\/image\/[^\/]+\/(.+)$/)
    if (match) {
      return `https://assets.guestsnapper.com/${match[1]}`
    }
  }
  return src
}

/**
 * Check if URL is transformable (image from assets.guestsnapper.com)
 */
function isTransformableImage(url: string): boolean {
  if (!url) return false
  
  // Check if it's from our R2 bucket
  if (!url.includes('assets.guestsnapper.com')) {
    return false
  }
  
  // Check if it's an image file
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)$/i
  return imageExtensions.test(url)
}

/**
 * Extract the image path from a full URL
 */
function extractImagePath(url: string): string {
  try {
    const urlObj = new URL(url)
    // Remove leading slash from pathname
    return urlObj.pathname.replace(/^\//, '')
  } catch {
    // If it's already a relative path, return as-is
    return url.replace(/^\//, '')
  }
}