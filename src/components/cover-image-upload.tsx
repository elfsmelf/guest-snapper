"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, Image as ImageIcon, X, Camera, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface CoverImageUploadProps {
  event: {
    id: string
    name: string
    coverImageUrl?: string | null
  }
}

export function CoverImageUpload({ event }: CoverImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(event.coverImageUrl || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const router = useRouter()

  // Debug logging
  console.log('=== COVER IMAGE UPLOAD DEBUG ===')
  console.log('event prop:', event)
  console.log('event.coverImageUrl:', event.coverImageUrl)
  console.log('initial preview:', preview)
  console.log('selectedFile:', selectedFile)
  console.log('=================================')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: isUploading
  })

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    
    try {
      // Step 1: Get presigned URL
      const urlResponse = await fetch('/api/upload-cover-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size
        })
      })

      const urlResult = await urlResponse.json()
      
      if (!urlResult.success) {
        throw new Error(urlResult.error)
      }

      // Step 2: Upload directly to R2 using presigned URL
      const uploadResponse = await fetch(urlResult.uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload to storage failed')
      }

      // Step 3: Update database with new cover image URL
      const updateResponse = await fetch(`/api/events/${event.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverImageUrl: urlResult.fileUrl
        })
      })

      const updateResult = await updateResponse.json()

      if (updateResult.success) {
        toast.success('Cover image updated successfully!')
        setSelectedFile(null)
        router.refresh() // Refresh to show new cover image
      } else {
        throw new Error(updateResult.error)
      }
    } catch (error) {
      console.error('Cover image upload failed:', error)
      toast.error('Failed to upload cover image')
    } finally {
      setIsUploading(false)
    }
  }

  const removeCoverImage = async () => {
    setIsUploading(true)
    
    try {
      const response = await fetch(`/api/events/${event.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverImageUrl: null
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Cover image removed successfully!')
        setPreview(null)
        setSelectedFile(null)
        router.refresh()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Cover image removal failed:', error)
      toast.error('Failed to remove cover image')
    } finally {
      setIsUploading(false)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreview(event.coverImageUrl || null)
    if (selectedFile && preview) {
      URL.revokeObjectURL(preview)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ImageIcon className="mr-2 h-5 w-5" />
          Gallery Cover Image
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Current Cover Image</Label>
          
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Cover preview"
                className="w-full h-48 object-cover rounded-lg border"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                {selectedFile ? (
                  // Show clear selection button when a new file is selected
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={clearSelection}
                    disabled={isUploading}
                    title="Cancel selection"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  // Show remove button only for existing cover images (not new selections)
                  event.coverImageUrl && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={removeCoverImage}
                      disabled={isUploading}
                      title="Remove cover image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )
                )}
              </div>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-border/80'
                }
                ${isUploading ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-primary">Drop your cover image here!</p>
              ) : (
                <div>
                  <p className="text-foreground mb-2">
                    Drag & drop a cover image here
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse your device
                  </p>
                  <Button variant="outline">
                    <Camera className="w-4 h-4 mr-2" />
                    Choose Image
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                JPG, PNG, WebP up to 10MB
              </p>
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(1)}MB
              </p>
            </div>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          This image will be displayed as the header/hero image in your gallery.
        </p>
      </CardContent>
    </Card>
  )
}