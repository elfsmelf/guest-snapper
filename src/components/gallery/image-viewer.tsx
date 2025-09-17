"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Download, User, Calendar } from "lucide-react"
import { CloudflareImage } from "@/components/ui/cloudflare-image"
import { getOriginalImageUrl } from "@/lib/cloudflare-image"

interface Upload {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  caption?: string
  uploaderName?: string
  isApproved: boolean
  createdAt: string | Date
  [key: string]: any // Allow extra properties from database
}

interface ImageViewerProps {
  upload: Upload | null
  isOpen: boolean
  onClose: () => void
  allowGuestDownloads?: boolean
}

export function ImageViewer({ upload, isOpen, onClose, allowGuestDownloads = false }: ImageViewerProps) {
  const [shouldLoadImage, setShouldLoadImage] = useState(false)
  
  useEffect(() => {
    if (!isOpen || !upload) {
      setShouldLoadImage(false)
      return
    }
    
    // Start loading the image when modal opens
    setShouldLoadImage(true)
    
    // Preload the image to Vercel's edge cache
    if (upload.fileUrl && !upload.fileType.startsWith('video/')) {
      const img = new window.Image()
      img.src = upload.fileUrl
    }
  }, [isOpen, upload])
  
  if (!upload) return null

  const isVideo = upload.fileType === 'video'
  
  // Optimize image URLs for Vercel's Image Optimization API
  const getOptimizedImageUrl = (url: string, width: number, quality: number = 85) => {
    if (url.includes('/_next/image') || url.includes('vercel.app')) {
      return url // Already optimized
    }
    return url // Return original for external URLs
  }

  const handleDownload = () => {
    // Use server-side download proxy to avoid CORS issues
    const imageUrl = getOriginalImageUrl(upload.fileUrl)
    const downloadUrl = `/api/download?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(upload.fileName)}`

    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = upload.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        showCloseButton={false}
        className="
          p-0
          overflow-auto
          bg-white border-0 shadow-2xl
        "
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: '90vw',
          maxHeight: '90vh',
          minWidth: '0'
        }}
      >
        <div className="relative flex flex-col max-h-full">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          {/* Media container with intrinsic sizing */}
          <div className="
            grid place-items-center
            bg-black
            overflow-auto
            flex-1 min-h-0
          ">
            {isVideo ? (
              shouldLoadImage ? (
                <video
                  src={upload.fileUrl}
                  controls
                  className="
                    block
                    h-auto w-auto
                    max-w-[85vw]
                    object-contain
                  "
                  autoPlay
                  muted
                  preload="metadata"
                />
              ) : (
                <div className="w-full h-[50vh] bg-gray-200 animate-pulse flex items-center justify-center">
                  <span className="text-gray-500">Loading video...</span>
                </div>
              )
            ) : (
              shouldLoadImage ? (
                <CloudflareImage
                  src={upload.fileUrl}
                  alt={upload.fileName}
                  className="
                    block
                    h-auto w-auto
                    max-w-[85vw] sm:max-w-[60vw]
                    max-h-[75vh]
                    object-contain
                    [image-rendering:auto]
                  "
                />
              ) : (
                <div className="w-full h-[50vh] bg-gray-200 animate-pulse flex items-center justify-center">
                  <span className="text-gray-500">Loading image...</span>
                </div>
              )
            )}
          </div>

          {/* Info section at bottom */}
          <div className="border-t bg-white flex-shrink-0 min-h-[80px] sm:min-h-[100px] flex flex-col">
            <div className="flex items-center justify-between p-4 sm:px-6 sm:py-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                {upload.uploaderName && (
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="hidden sm:inline">{upload.uploaderName}</span>
                    <span className="sm:hidden">{upload.uploaderName.split(' ')[0]}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="hidden sm:inline">{new Date(upload.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}</span>
                  <span className="sm:hidden">{new Date(upload.createdAt).toLocaleDateString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: '2-digit'
                  })}</span>
                </div>
              </div>
              
              {/* Download button - only show if guest downloads are allowed */}
              {allowGuestDownloads && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:bg-gray-100 rounded-full h-8 w-8"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Caption with proper spacing */}
            {upload.caption && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <p className="text-sm sm:text-base text-gray-700">{upload.caption}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}