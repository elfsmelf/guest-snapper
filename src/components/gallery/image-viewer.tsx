"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Download, User, Calendar } from "lucide-react"

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
  preloadedDimensions?: { w: number; h: number }
}

export function ImageViewer({ upload, isOpen, onClose, preloadedDimensions }: ImageViewerProps) {
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(null)
  
  useEffect(() => {
    if (!isOpen || !upload || upload.fileType === 'video') {
      setImageSize(null)
      return
    }
    
    // Use preloaded dimensions if available
    if (preloadedDimensions) {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const maxW = vw * 0.9
      const maxH = vh * 0.85
      
      const scale = Math.min(maxW / preloadedDimensions.w, maxH / preloadedDimensions.h, 1)
      const w = Math.floor(preloadedDimensions.w * scale)
      const h = Math.floor(preloadedDimensions.h * scale)
      
      setImageSize({ w, h })
    } else {
      // Fallback to loading dimensions
      const img = new window.Image()
      img.src = upload.fileUrl
      img.onload = () => {
        const vw = window.innerWidth
        const vh = window.innerHeight
        const maxW = vw * 0.9
        const maxH = vh * 0.85
        
        const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
        const w = Math.floor(img.naturalWidth * scale)
        const h = Math.floor(img.naturalHeight * scale)
        
        setImageSize({ w, h })
      }
      img.onerror = () => setImageSize({ w: 300, h: 400 }) // fallback
    }
  }, [isOpen, upload, preloadedDimensions])
  
  if (!upload) return null

  const isVideo = upload.fileType === 'video'

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = upload.fileUrl
    a.download = upload.fileName
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const dialogStyle = imageSize && !isVideo ? {
    width: `${imageSize.w}px`,
    maxWidth: '90vw',
    height: 'auto',
    maxHeight: '90vh'
  } : {}

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="p-0 bg-white border-0 shadow-2xl overflow-hidden"
        style={dialogStyle}
      >
        <div className="relative flex flex-col h-full">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          {/* Media container */}
          <div className="relative bg-gray-100 flex-shrink-0">
            {isVideo ? (
              <video
                src={upload.fileUrl}
                controls
                className="w-full max-h-[70vh] object-contain"
                autoPlay
                muted
              />
            ) : (
              <img
                src={upload.fileUrl}
                alt={upload.fileName}
                className="w-full h-auto object-contain"
                style={imageSize ? { maxHeight: `${imageSize.h}px` } : {}}
              />
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
              
              {/* Download button */}
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:bg-gray-100 rounded-full h-8 w-8"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
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