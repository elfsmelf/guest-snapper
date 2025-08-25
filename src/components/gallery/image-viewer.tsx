"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Download, User, Calendar } from "lucide-react"
import Image from "next/image"

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
}

export function ImageViewer({ upload, isOpen, onClose }: ImageViewerProps) {
  const [shouldLoadImage, setShouldLoadImage] = useState(false)
  
  useEffect(() => {
    if (!isOpen || !upload) {
      setShouldLoadImage(false)
      return
    }
    
    // Only start loading the image when modal opens
    setShouldLoadImage(true)
  }, [isOpen, upload])
  
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="p-0 bg-white border-0 shadow-2xl overflow-hidden max-w-[90vw] max-h-[90vh]"
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
              shouldLoadImage ? (
                <video
                  src={upload.fileUrl}
                  controls
                  className="w-full max-h-[70vh] object-contain"
                  autoPlay
                  muted
                />
              ) : (
                <div className="w-full h-[50vh] bg-gray-200 animate-pulse flex items-center justify-center">
                  <span className="text-gray-500">Loading video...</span>
                </div>
              )
            ) : (
              shouldLoadImage ? (
                <div className="relative w-full h-[70vh]">
                  <Image
                    src={upload.fileUrl}
                    alt={upload.fileName}
                    fill
                    className="object-contain"
                    sizes="90vw"
                    priority
                  />
                </div>
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