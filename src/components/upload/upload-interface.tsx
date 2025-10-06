"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { useDropzone } from "react-dropzone"
import { useBatchUpload } from "@/hooks/use-upload"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  plan?: string | null
  albums: { id: string; name: string; sortOrder: number; uploadsCount?: number; isFavorite?: boolean }[]
  generalUploadsCount?: number
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
  guestCanUpload?: boolean
  isOnboardingStep?: boolean // New prop to hide certain elements during onboarding
  onUploadComplete?: (uploadCount: number) => void // Callback for onboarding steps
  forcePublicView?: boolean
  shouldShowCounts?: boolean
}

export function UploadInterface({ event, uploadWindowOpen, isOwner, guestCanUpload = false, isOnboardingStep = false, onUploadComplete, forcePublicView = false, shouldShowCounts = false }: UploadInterfaceProps) {
  // Determine default album: favorite album, or first album, or empty string (unassigned)
  const getDefaultAlbumId = () => {
    if (event.albums.length === 0) return ""
    const favoriteAlbum = event.albums.find(a => a.isFavorite)
    if (favoriteAlbum) return favoriteAlbum.id
    // If only one album, make it the default
    if (event.albums.length === 1) return event.albums[0].id
    return ""
  }

  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploaderName, setUploaderName] = useState("")
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(getDefaultAlbumId())
  const router = useRouter()
  
  // Use React Query batch upload hook
  const batchUpload = useBatchUpload({
    onSuccess: (data) => {
      // Call onboarding callback when uploads complete successfully
      if (isOnboardingStep && onUploadComplete) {
        onUploadComplete(data.successfulUploads)
      }
      // For regular uploads, let users manually choose to view gallery
      // The "View Gallery" button will trigger a fresh page load to show new images
    }
  })
  const isUploading = batchUpload.isPending
  
  // Check client-side session
  const clientSession = authClient.useSession()

  // Load guest name from localStorage on mount for anonymous users
  React.useEffect(() => {
    if (!clientSession?.data?.user) {
      const storageKey = `guestName_${event.slug}`
      const savedGuestName = localStorage.getItem(storageKey)
      if (savedGuestName) {
        setUploaderName(savedGuestName)
      }
    }
  }, [clientSession?.data?.user, event.slug])


  // Save guest name to localStorage when it changes for anonymous users
  const handleUploaderNameChange = (name: string) => {
    setUploaderName(name)
    if (!clientSession?.data?.user && name.trim()) {
      const storageKey = `guestName_${event.slug}`
      localStorage.setItem(storageKey, name.trim())
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Process special format files - convert both file and preview
    const processedFiles = await Promise.all(
      acceptedFiles.map(async (file) => {
        const ext = file.name.split('.').pop()?.toLowerCase()

        // Check if file is HEIC/HEIF
        if (ext === 'heic' || ext === 'heif' || file.type === 'image/heic' || file.type === 'image/heif') {
          try {
            console.log(`🔄 Converting HEIC file: ${file.name}`)

            // Dynamically import heic2any to avoid SSR issues
            const heic2any = (await import('heic2any')).default

            // Convert HEIC to JPEG
            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.9
            })

            // Handle both single blob and array of blobs
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob

            // Create new File object with JPEG extension
            const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
            const convertedFile = new File([blob], newFileName, { type: 'image/jpeg' })

            console.log(`✅ HEIC converted: ${file.name} -> ${newFileName} (${blob.size} bytes)`)

            return {
              file: convertedFile,
              preview: URL.createObjectURL(blob)
            }
          } catch (error) {
            console.error('❌ Failed to convert HEIC file:', error)
            const { toast } = await import('sonner')
            toast.error(`Failed to convert ${file.name}. Please use a JPG or PNG file instead.`)
            return null
          }
        }

        // Check if file is TIFF
        if (ext === 'tiff' || ext === 'tif' || file.type === 'image/tiff') {
          try {
            console.log(`🔄 Converting TIFF file: ${file.name}`)

            // Read TIFF file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer()

            // Dynamically import utif2 to avoid SSR issues
            const UTIF = (await import('utif2')).default

            // Decode TIFF
            const ifds = UTIF.decode(arrayBuffer)
            UTIF.decodeImage(arrayBuffer, ifds[0])

            const rgba = UTIF.toRGBA8(ifds[0])

            // Create canvas to convert to JPEG
            const canvas = document.createElement('canvas')
            canvas.width = ifds[0].width
            canvas.height = ifds[0].height
            const ctx = canvas.getContext('2d')!

            const imageData = ctx.createImageData(canvas.width, canvas.height)
            imageData.data.set(rgba)
            ctx.putImageData(imageData, 0, 0)

            // Convert canvas to blob
            const blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9)
            })

            // Create new File object with JPEG extension
            const newFileName = file.name.replace(/\.(tiff|tif)$/i, '.jpg')
            const convertedFile = new File([blob], newFileName, { type: 'image/jpeg' })

            console.log(`✅ TIFF converted: ${file.name} -> ${newFileName} (${blob.size} bytes)`)

            return {
              file: convertedFile,
              preview: URL.createObjectURL(blob)
            }
          } catch (error) {
            console.error('❌ Failed to convert TIFF file:', error)
            const { toast } = await import('sonner')
            toast.error(`Failed to convert ${file.name}. Please use a JPG or PNG file instead.`)
            return null
          }
        }

        // Standard image formats
        return {
          file,
          preview: URL.createObjectURL(file)
        }
      })
    )

    // Filter out failed conversions
    const validFiles = processedFiles.filter((f): f is { file: File; preview: string } => f !== null)

    const newFiles = validFiles.map(({ file, preview }) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview,
      uploaderName: uploaderName,
      caption: "",
      albumId: selectedAlbumId,
      status: 'pending' as const,
      progress: 0
    }))

    setFiles(prev => [...prev, ...newFiles])
  }, [uploaderName, selectedAlbumId])

  // Determine max file size based on plan
  const plan = event.plan || 'free_trial'
  const maxFileSizeMB = plan === 'free_trial' ? 100 : 100 // 100MB for all plans
  const maxFileSize = maxFileSizeMB * 1024 * 1024

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic', '.heif', '.gif', '.avif', '.tiff', '.tif'],
      'video/*': ['.mp4', '.mov', '.avi', '.quicktime']
    },
    maxSize: maxFileSize,
    disabled: !uploadWindowOpen || isUploading
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
    if (files.length === 0) return

    const pendingFiles = files.filter(f => f.status === 'pending')
    if (pendingFiles.length === 0) return

    // Initialize all files to 0% progress before starting
    pendingFiles.forEach(file => {
      updateFile(file.id, { 
        status: 'uploading', 
        progress: 0 
      })
    })

    const batchStartTime = Date.now();
    console.log(`Starting batch upload of ${pendingFiles.length} files`) // Debug

    try {
      await batchUpload.mutateAsync({
        eventId: event.id,
        files: pendingFiles.map(f => ({
          id: f.id,
          file: f.file,
          caption: f.caption,
          albumId: f.albumId
        })),
        uploaderName: uploaderName || undefined,
        globalConcurrency: 5, // Upload 5 small files concurrently for speed
        onFileProgress: (fileId, progress) => {
          console.log(`🔄 File ${fileId} progress received:`, progress) // Debug logging
          const file = files.find(f => f.id === fileId);
          console.log(`📁 Updating file "${file?.file?.name}" progress to ${progress.percent}%`) // Debug
          updateFile(fileId, { 
            status: 'uploading', 
            progress: Math.min(99, progress.percent) // Cap at 99% until complete
          })
        },
        onFileComplete: (fileId, result) => {
          console.log(`File ${fileId} completed:`, result) // Debug logging
          if (result.error) {
            updateFile(fileId, { 
              status: 'error', 
              error: result.error,
              progress: 0 
            })
          } else {
            updateFile(fileId, { 
              status: 'success', 
              progress: 100 
            })
          }
        }
      })
      
      const batchTotalTime = Date.now() - batchStartTime;
      const totalSize = pendingFiles.reduce((sum, f) => sum + f.file.size, 0);
      const avgSpeedMBps = (totalSize / (1024 * 1024)) / (batchTotalTime / 1000);
      console.log(`🎉 Batch upload completed: ${pendingFiles.length} files in ${batchTotalTime}ms (${avgSpeedMBps.toFixed(2)} MB/s avg)`) // Debug
      
    } catch (error) {
      console.error('Batch upload failed:', error)
      // Individual file errors are handled in onFileComplete
    }
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
          <Button onClick={() => {
            window.location.href = `/gallery/${event.slug}`
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gallery
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        {/* Compact Name Input - Hidden during onboarding */}
        {!isOnboardingStep && (
          <div className="mb-4 bg-card rounded-lg p-4 border border-border">
            <Label htmlFor="uploader-name" className="text-sm font-medium text-foreground">
              Your Name {!clientSession?.data?.user ? "(saved for next time)" : "(optional)"}
            </Label>
            <Input
              id="uploader-name"
              value={uploaderName}
              onChange={(e) => handleUploaderNameChange(e.target.value)}
              placeholder={!clientSession?.data?.user 
                ? "Enter your name (we'll remember it)"
                : "Your name (optional)"
              }
              disabled={isUploading}
              className="mt-1"
              autoComplete="off"
            />
          </div>
        )}

        {/* Album Selection */}
        {event.albums.length > 0 && (
          <div className="mb-4">
            <Label className="text-sm font-medium text-foreground mb-3 block">
              Upload to Album
            </Label>
            <Tabs value={selectedAlbumId} onValueChange={(value) => {
              setSelectedAlbumId(value)
              // Update all pending files to use the new album
              setFiles(prev => prev.map(file => 
                file.status === 'pending' ? { ...file, albumId: value } : file
              ))
            }} className="w-full">
              <TabsList className="grid w-full bg-muted" style={{ gridTemplateColumns: `repeat(${event.albums.length + 1}, minmax(0, 1fr))` }}>
                <TabsTrigger value="" className="text-xs">
                  All Photos {shouldShowCounts && `(${event.generalUploadsCount || 0})`}
                </TabsTrigger>
                {event.albums.map((album) => (
                  <TabsTrigger key={album.id} value={album.id} className="text-xs">
                    {album.name} {shouldShowCounts && `(${album.uploadsCount || 0})`}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Modern Drop Zone with Image Grid */}
        <div className={`bg-card rounded-xl overflow-hidden transition-colors ${
          files.length > 0 ? 'border border-gray-200' : 'border-2 border-dashed border-gray-300 hover:border-gray-400'
        }`}>
          <div
            {...getRootProps()}
            className={`relative flex min-h-52 flex-col items-center p-6 transition-colors ${
              isDragActive && files.length === 0
                ? 'bg-primary/5' 
                : ''
            } ${files.length === 0 ? 'justify-center' : ''} ${!uploadWindowOpen || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <input {...getInputProps()} className="sr-only" aria-label="Upload files" />
            
            {files.length > 0 ? (
              <div className="flex w-full flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium">
                    Files to Upload ({files.length})
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
                      fileInput?.click()
                    }}
                    disabled={isUploading}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5 opacity-60" />
                    Add more
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {files.map((file) => (
                    <div key={file.id} className="relative aspect-square rounded-lg bg-card border border-border group">
                      {file.file.type.startsWith('image/') ? (
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : file.file.type.startsWith('video/') ? (
                        <div className="w-full h-full rounded-lg bg-black/90 flex items-center justify-center relative overflow-hidden">
                          <video
                            src={file.preview}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/30">
                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                              <Video className="h-6 w-6 text-black" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-lg bg-card flex items-center justify-center">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Status overlay */}
                      {file.status === 'uploading' && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <div className="text-white text-center">
                            <Loader2 className="h-6 w-6 mx-auto mb-1 animate-spin" />
                            <div className="text-xs font-bold">{file.progress}%</div>
                            <div className="w-16 h-1 bg-white/20 rounded mt-1">
                              <div 
                                className="h-1 bg-white rounded transition-all duration-300"
                                style={{ width: `${file.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {file.status === 'success' && (
                        <div className="absolute top-2 left-2">
                          <CheckCircle className="h-4 w-4 text-primary bg-background rounded-full" />
                        </div>
                      )}
                      
                      {file.status === 'error' && (
                        <div className="absolute inset-0 bg-destructive/20 rounded-lg flex items-center justify-center">
                          <AlertCircle className="h-6 w-6 text-destructive" />
                        </div>
                      )}

                      {/* Remove button */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(file.id)
                        }}
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full border-2 border-background bg-foreground hover:bg-destructive shadow-sm"
                        disabled={isUploading}
                      >
                        <X className="h-3.5 w-3.5 text-white" />
                      </Button>

                      {/* File info on hover */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-xs truncate">{file.file.name}</div>
                        <div className="text-xs text-muted-foreground">{(file.file.size / (1024 * 1024)).toFixed(1)}MB</div>
                        {file.albumId && event.albums.length > 0 && (
                          <div className="text-xs text-white/80 mt-1">
                            Album: {event.albums.find(a => a.id === file.albumId)?.name || 'General'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="bg-card mb-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border">
                  <Camera className="h-4 w-4 opacity-60" />
                </div>
                <p className="mb-1.5 text-sm font-medium">Drop your photos here</p>
                <p className="text-xs text-muted-foreground">
                  Photos & Videos (JPEG, PNG, MP4, MOV - max 50MB)
                </p>
                <Button variant="outline" className="mt-4" disabled={!uploadWindowOpen || isUploading}>
                  <Upload className="h-4 w-4 mr-2 opacity-60" />
                  Select files
                </Button>
              </div>
            )}
          </div>
          
          {/* Upload Actions */}
          {files.length > 0 && (
            <div className="border-t bg-card p-4">
              <div className="flex items-center justify-between gap-4">
                {/* Status */}
                <div className="flex items-center gap-4 text-sm">
                  {successCount > 0 && (
                    <span className="text-primary">{successCount} uploaded</span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-destructive">{errorCount} failed</span>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
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
                    disabled={isUploading || files.every(f => f.status !== 'pending')}
                    size="sm"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload ({files.filter(f => f.status === 'pending').length})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compact Success Message - Hide View Gallery button during onboarding */}
        {successCount > 0 && successCount === files.length && (
          <Alert className="mt-4 bg-card border border-border">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm">All files uploaded successfully!</span>
                {!isOnboardingStep && (
                  <Button 
                    size="sm" 
                    onClick={() => {
                      window.location.href = `/gallery/${event.slug}`
                    }}
                  >
                    View Gallery
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}