"use client"

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
}

export function ImageViewer({ upload, isOpen, onClose }: ImageViewerProps) {
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
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-white border-0 shadow-2xl">
        <div className="relative w-full h-full flex flex-col">
          {/* Full-width media at top */}
          <div className="w-full flex-1">
            {isVideo ? (
              <video
                src={upload.fileUrl}
                controls
                className="w-full h-full object-contain rounded-t-lg"
                autoPlay
                muted
              />
            ) : (
              <img
                src={upload.fileUrl}
                alt={upload.fileName}
                className="w-full h-full object-contain rounded-t-lg"
              />
            )}
          </div>

          {/* Info section at bottom */}
          <div className="p-6 border-t bg-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {upload.fileName}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(upload.createdAt).toLocaleDateString()}</span>
                  </div>
                  {upload.uploaderName && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{upload.uploaderName}</span>
                    </div>
                  )}
                </div>
                {upload.caption && (
                  <p className="text-gray-700 text-sm">{upload.caption}</p>
                )}
              </div>
              
              {/* Download button */}
              <div className="flex items-center ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:bg-gray-100 rounded-full"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}