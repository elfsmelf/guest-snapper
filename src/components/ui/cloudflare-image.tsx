"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

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
}

/**
 * CloudflareImage component that serves images directly from Cloudflare R2
 * with proper caching headers to avoid Vercel edge requests.
 * 
 * Since Next.js image optimization is disabled (unoptimized: true),
 * images are served directly from their source URLs without going through
 * Vercel's /_next/image endpoint.
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
  style
}: CloudflareImageProps) {
  const [imageError, setImageError] = useState(false)
  
  // Ensure images from assets.guestsnapper.com are served with cache headers
  const getOptimizedSrc = (url: string) => {
    // If already from assets domain, return as-is
    if (url.includes('assets.guestsnapper.com')) {
      return url
    }
    
    // For other domains, return as-is (Next.js will handle based on config)
    return url
  }
  
  const optimizedSrc = getOptimizedSrc(src)
  
  // Fallback to regular img tag if there's an error
  if (imageError) {
    return (
      <img
        src={optimizedSrc}
        alt={alt}
        className={className}
        loading={loading}
        style={style}
        onClick={onClick}
        onLoad={onLoad}
      />
    )
  }
  
  // Use Next.js Image with unoptimized flag from config
  // This bypasses Vercel's image optimization and serves directly
  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      loading={loading}
      onError={() => setImageError(true)}
      onLoad={onLoad}
      onClick={onClick}
      style={style}
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