"use client"

import { getOptimizedImageUrl, getOriginalImageUrl } from "@/lib/cloudflare-image"

interface CloudflareImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
  loading?: "lazy" | "eager"
  onLoad?: () => void
  onClick?: () => void
  style?: React.CSSProperties
  useOriginal?: boolean // For downloads or when you need the original
}

/**
 * CloudflareImage component that serves optimized images via Cloudflare Image Resizing
 * 
 * Strategy: ONE transformation per image
 * - Serves WebP/AVIF automatically based on browser support
 * - Single 1920px wide version that works for all screen sizes
 * - Original stays in R2, optimized version cached at edge
 */
export function CloudflareImage({
  src,
  alt,
  width,
  height,
  fill,
  className,
  sizes,
  priority = false,
  loading = "lazy",
  onLoad,
  onClick,
  style,
  useOriginal = false
}: CloudflareImageProps) {
  // Get the optimized URL (or original if requested)
  const imageSrc = useOriginal ? getOriginalImageUrl(src) : getOptimizedImageUrl(src)
  
  // FIXED: Use regular img tag since Cloudflare handles optimization
  // This avoids Next.js Image conflicts and is more performant
  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading={loading}
      style={style}
      onClick={onClick}
      onLoad={onLoad}
    />
  )
}

/**
 * Lightweight img component for maximum performance when serving from Cloudflare.
 * Use this when you don't need Next.js Image features and want direct CDN serving.
 */
export function CloudflareImg({
  src,
  alt,
  className,
  loading = "lazy",
  sizes,
  onClick,
  onLoad,
  style
}: {
  src: string
  alt: string
  className?: string
  loading?: "lazy" | "eager"
  sizes?: string
  onClick?: () => void
  onLoad?: () => void
  style?: React.CSSProperties
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      sizes={sizes}
      onClick={onClick}
      onLoad={onLoad}
      style={style}
    />
  )
}