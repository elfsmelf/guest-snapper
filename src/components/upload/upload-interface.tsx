"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAnonymousAuth } from "@/hooks/useAnonymousAuth"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  X, 
  Camera, 
  Video, 
  ArrowLeft, 
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Event {
  id: string
  name: string
  coupleNames: string
  eventDate: string
  slug: string
  userId: string
  uploadWindowEnd: string
  albums: { id: string; name: string; sortOrder: number }[]
}

interface UploadFile {
  id: string
  file: File
  preview: string
  uploaderName: string
  caption: string
  albumId: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

interface UploadInterfaceProps {
  event: Event
  uploadWindowOpen: boolean
  isOwner: boolean
}

export function UploadInterface({ event, uploadWindowOpen, isOwner }: UploadInterfaceProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploaderName, setUploaderName] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()
  
  // Initialize anonymous authentication for upload interface
  const { isInitialized, session } = useAnonymousAuth()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      uploaderName: uploaderName,
      caption: "",
      albumId: event.albums[0]?.id || "",
      status: 'pending' as const,
      progress: 0
    }))
    
    setFiles(prev => [...prev, ...newFiles])
  }, [uploaderName, event.albums])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic'],
      'video/*': ['.mp4', '.mov', '.avi', '.quicktime']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: !uploadWindowOpen || isUploading || !isInitialized
  })

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const updateFile = (id: string, updates: Partial<UploadFile>) => {
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ))
  }

  const handleUploadAll = async () => {
    if (files.length === 0 || !isInitialized) return

    setIsUploading(true)

    for (const file of files) {
      if (file.status !== 'pending') continue

      updateFile(file.id, { status: 'uploading', progress: 0 })

      try {
        // Step 1: Get presigned URL
        updateFile(file.id, { progress: 10 })
        
        const urlResponse = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event.id,
            fileName: file.file.name,
            fileType: file.file.type,
            fileSize: file.file.size
          })
        })

        const urlResult = await urlResponse.json()
        
        if (!urlResult.success) {
          throw new Error(urlResult.error)
        }

        // Step 2: Upload directly to R2
        updateFile(file.id, { progress: 50 })
        
        const uploadResponse = await fetch(urlResult.uploadUrl, {
          method: 'PUT',
          body: file.file,
          headers: {
            'Content-Type': file.file.type,
          },
        })

        if (!uploadResponse.ok) {
          throw new Error(`R2 upload failed: ${uploadResponse.status}`)
        }

        // Step 3: Save metadata to database
        updateFile(file.id, { progress: 80 })
        
        const dbResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event.id,
            albumId: file.albumId || null,
            uploaderName: file.uploaderName || null,
            caption: file.caption || null,
            fileName: file.file.name,
            fileSize: file.file.size,
            fileType: file.file.type.startsWith('image/') ? 'image' : file.file.type.startsWith('audio/') ? 'audio' : 'video',
            fileKey: urlResult.fileKey,
            fileUrl: urlResult.fileUrl,
            mimeType: file.file.type
          })
        })

        const dbResult = await dbResponse.json()

        if (dbResult.success) {
          updateFile(file.id, { status: 'success', progress: 100 })
        } else {
          throw new Error(dbResult.error)
        }
        
      } catch (error) {
        updateFile(file.id, { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed',
          progress: 0 
        })
        console.error(`Upload failed for ${file.file.name}:`, error)
      }
    }

    setIsUploading(false)
  }

  const successCount = files.filter(f => f.status === 'success').length
  const errorCount = files.filter(f => f.status === 'error').length

  if (!uploadWindowOpen && !isOwner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Upload Window Closed</h1>
          <p className="text-muted-foreground mb-6">
            The upload window for this event has ended. Thank you for your interest in sharing memories!
          </p>
          <Button onClick={() => router.push(`/gallery/${event.slug}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gallery
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/gallery/${event.slug}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gallery
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">{event.coupleNames}</h1>
            <p className="text-muted-foreground">
              Share your photos and videos from {event.name}
            </p>
          </div>
        </div>

        {/* Uploader Name */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="uploader-name">Your Name (Optional)</Label>
              <Input
                id="uploader-name"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                placeholder="Enter your name to be credited with uploads"
                disabled={isUploading}
              />
            </div>
          </CardContent>
        </Card>

        {/* File Drop Zone */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              } ${!uploadWindowOpen || isUploading || !isInitialized ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {isDragActive ? 'Drop files here' : 'Upload Photos & Videos'}
              </h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop files here, or click to select files
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Camera className="h-4 w-4" />
                  <span>Photos (JPEG, PNG, WebP, HEIC)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Video className="h-4 w-4" />
                  <span>Videos (MP4, MOV, AVI)</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Max file size: 50MB</p>
            </div>
          </CardContent>
        </Card>

        {/* File List */}
        {files.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Files to Upload ({files.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {/* Preview */}
                    <div className="flex-shrink-0">
                      {file.file.type.startsWith('image/') ? (
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <Video className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium truncate">{file.file.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {(file.file.size / (1024 * 1024)).toFixed(1)} MB
                        </Badge>
                        {file.status === 'success' && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Uploaded
                          </Badge>
                        )}
                        {file.status === 'error' && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                        {file.status === 'uploading' && (
                          <Badge variant="secondary" className="text-xs">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Uploading
                          </Badge>
                        )}
                      </div>

                      {/* Progress */}
                      {file.status === 'uploading' && (
                        <Progress value={file.progress} className="mb-2" />
                      )}

                      {/* Error message */}
                      {file.status === 'error' && file.error && (
                        <p className="text-sm text-destructive mb-2">{file.error}</p>
                      )}

                      {/* Album Selection */}
                      {file.status === 'pending' && event.albums.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <Label htmlFor={`album-${file.id}`} className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                            Album:
                          </Label>
                          <select
                            id={`album-${file.id}`}
                            value={file.albumId}
                            onChange={(e) => updateFile(file.id, { albumId: e.target.value })}
                            className="h-7 px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ minWidth: '140px', maxWidth: '200px' }}
                            disabled={isUploading}
                          >
                            <option value="">General</option>
                            {event.albums.map((album) => (
                              <option key={album.id} value={album.id}>
                                {album.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Upload Actions */}
        {files.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {successCount > 0 && (
                <span className="text-green-600">
                  {successCount} uploaded successfully
                </span>
              )}
              {errorCount > 0 && (
                <span className="text-destructive ml-4">
                  {errorCount} failed
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  files.forEach(file => URL.revokeObjectURL(file.preview))
                  setFiles([])
                }}
                disabled={isUploading}
              >
                Clear All
              </Button>
              
              <Button
                onClick={handleUploadAll}
                disabled={isUploading || files.every(f => f.status !== 'pending') || !isInitialized}
              >
                {!isInitialized ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload All ({files.filter(f => f.status === 'pending').length})
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successCount > 0 && successCount === files.length && (
          <Alert className="mt-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>All files uploaded successfully! They will appear in the gallery once approved.</span>
                <Button 
                  size="sm" 
                  onClick={() => router.push(`/gallery/${event.slug}`)}
                  className="ml-4"
                >
                  View Gallery
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}