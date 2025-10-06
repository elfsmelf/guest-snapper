"use client"

import { useState, useEffect } from 'react'
import { CloudflareImage } from '@/components/ui/cloudflare-image'

interface HeicImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  loading?: "lazy" | "eager"
  onClick?: () => void
  onLoad?: () => void
  style?: React.CSSProperties
}

/**
 * Smart image component that handles HEIC and TIFF files by converting them to JPEG
 * for browser display. Falls back to CloudflareImage for standard formats.
 */
export function HeicImage({ src, alt, ...props }: HeicImageProps) {
  const [convertedSrc, setConvertedSrc] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [conversionFailed, setConversionFailed] = useState(false)

  useEffect(() => {
    async function convertImageIfNeeded() {
      const srcLower = src.toLowerCase()
      const isHeic = srcLower.endsWith('.heic') || srcLower.endsWith('.heif')
      const isTiff = srcLower.endsWith('.tiff') || srcLower.endsWith('.tif')

      if (!isHeic && !isTiff) {
        // Standard format, use original source
        setConvertedSrc(src)
        return
      }

      setIsConverting(true)

      try {
        // Fetch the file
        const response = await fetch(src)
        const blob = await response.blob()

        let jpegBlob: Blob

        if (isHeic) {
          // Convert HEIC to JPEG
          const heic2any = (await import('heic2any')).default

          const convertedBlob = await heic2any({
            blob,
            toType: 'image/jpeg',
            quality: 0.9
          })

          jpegBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
        } else {
          // Convert TIFF to JPEG
          const arrayBuffer = await blob.arrayBuffer()
          const UTIF = (await import('utif2')).default

          const ifds = UTIF.decode(arrayBuffer)
          UTIF.decodeImage(arrayBuffer, ifds[0])
          const rgba = UTIF.toRGBA8(ifds[0])

          const canvas = document.createElement('canvas')
          canvas.width = ifds[0].width
          canvas.height = ifds[0].height
          const ctx = canvas.getContext('2d')!

          const imageData = ctx.createImageData(canvas.width, canvas.height)
          imageData.data.set(rgba)
          ctx.putImageData(imageData, 0, 0)

          jpegBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9)
          })
        }

        // Create object URL for display
        const url = URL.createObjectURL(jpegBlob)
        setConvertedSrc(url)
      } catch (error) {
        console.error('Failed to convert image:', error)
        setConversionFailed(true)
        // Fallback: try to display original
        setConvertedSrc(src)
      } finally {
        setIsConverting(false)
      }
    }

    convertImageIfNeeded()

    // Cleanup object URL on unmount
    return () => {
      if (convertedSrc && convertedSrc.startsWith('blob:')) {
        URL.revokeObjectURL(convertedSrc)
      }
    }
  }, [src])

  // Show loading state
  if (isConverting) {
    return (
      <div className={props.className} style={props.style}>
        <div className="w-full h-full flex items-center justify-center bg-muted/20">
          <div className="text-sm text-muted-foreground">Converting image...</div>
        </div>
      </div>
    )
  }

  // Show error state
  if (conversionFailed) {
    return (
      <div className={props.className} style={props.style}>
        <div className="w-full h-full flex items-center justify-center bg-muted/20">
          <div className="text-sm text-muted-foreground">Unable to display image</div>
        </div>
      </div>
    )
  }

  // Display converted or original image
  if (convertedSrc) {
    // If it's a blob URL (converted HEIC), use regular img tag
    if (convertedSrc.startsWith('blob:')) {
      return <img src={convertedSrc} alt={alt} {...props} />
    }

    // Otherwise use CloudflareImage for optimization
    return <CloudflareImage src={convertedSrc} alt={alt} {...props} />
  }

  return null
}
