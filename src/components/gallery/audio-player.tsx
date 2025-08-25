"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  User, 
  Calendar,
  Download,
  Check,
  X
} from "lucide-react"

interface AudioUpload {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  caption?: string
  uploaderName?: string
  isApproved: boolean
  createdAt: string | Date
  albumId?: string | null
  [key: string]: any // Allow extra properties from database
}

interface AudioPlayerProps {
  upload: AudioUpload
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  showApprovalButtons?: boolean
}

export function AudioPlayer({ upload, onApprove, onReject, showApprovalButtons = false }: AudioPlayerProps) {
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
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with uploader info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {upload.uploaderName && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{upload.uploaderName}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(upload.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Approval buttons */}
              {showApprovalButtons && onApprove && onReject && (
                <>
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8 w-8 p-0 bg-primary hover:bg-primary/90"
                    onClick={() => onApprove(upload.id)}
                    title="Approve"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0"
                    onClick={() => onReject(upload.id)}
                    title="Reject"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {/* Download button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleDownload}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* HTML5 Audio Player */}
          <div className="bg-muted rounded-lg p-3">
            <audio
              src={upload.fileUrl}
              controls
              className="w-full"
              style={{ height: '50px' }}
            />
          </div>

          {/* Caption */}
          {upload.caption && (
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
              {upload.caption}
            </div>
          )}

        </div>
      </CardContent>
    </Card>
  )
}