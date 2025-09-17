"use client"

import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, Image as ImageIcon, X, Camera, Loader2, Crop } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Cropper } from "@origin-space/image-cropper"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface CoverImageUploadProps {
  event: {
    id: string
    name: string
    coverImageUrl?: string | null
  }
  onUploadSuccess?: () => Promise<void> | void
  hideCard?: boolean
}

type Area = { x: number; y: number; width: number; height: number }

export function CoverImageUpload({ event, onUploadSuccess, hideCard = false }: CoverImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(event.coverImageUrl || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null)
  const [croppedFile, setCroppedFile] = useState<File | null>(null)
  const [cropData, setCropData] = useState<Area | null>(null)
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)
  const router = useRouter()

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('=== COVER IMAGE UPLOAD DEBUG ===')
    console.log('event prop:', event)
    console.log('event.coverImageUrl:', event.coverImageUrl)
    console.log('initial preview:', preview)
    console.log('selectedFile:', selectedFile)
    console.log('showCropDialog:', showCropDialog)
    console.log('cropImageUrl:', cropImageUrl)
    console.log('=================================')
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('🎯 onDrop called with files:', acceptedFiles)
    const file = acceptedFiles[0]
    if (!file) return

    console.log('📁 File selected:', file.name, file.type, file.size)

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

    console.log('✅ File validation passed, opening crop dialog')
    // Show crop dialog instead of immediately setting preview
    const imageUrl = URL.createObjectURL(file)
    console.log('🖼️ Created image URL:', imageUrl)

    // Load the image to get its natural dimensions
    const img = new Image()
    img.onload = () => {
      console.log('📐 Image loaded, dimensions:', img.naturalWidth, 'x', img.naturalHeight)
      setOriginalImage(img)
      setCropImageUrl(imageUrl)
      setShowCropDialog(true)
      console.log('🎭 Set showCropDialog to true')
    }
    img.src = imageUrl
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

  const handleCropComplete = useCallback(async () => {
    if (!cropData || !originalImage) {
      toast.error('No crop data available')
      return
    }

    try {
      console.log('🔪 Starting crop with data:', cropData)

      // Create canvas to crop the image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      // Set canvas size to crop dimensions
      canvas.width = cropData.width
      canvas.height = cropData.height

      // Draw the cropped portion of the image
      ctx.drawImage(
        originalImage,
        cropData.x, cropData.y, cropData.width, cropData.height, // source rectangle
        0, 0, cropData.width, cropData.height // destination rectangle
      )

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            toast.error('Failed to create cropped image')
            return
          }

          console.log('✂️ Crop completed, blob size:', blob.size)

          // Convert blob to file
          const croppedImageFile = new File([blob], 'cover-image.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })

          setCroppedFile(croppedImageFile)
          setSelectedFile(croppedImageFile)
          setPreview(URL.createObjectURL(blob))
          setShowCropDialog(false)

          // Clean up the crop image URL
          if (cropImageUrl) {
            URL.revokeObjectURL(cropImageUrl)
            setCropImageUrl(null)
          }
        },
        'image/jpeg',
        0.9 // Quality
      )
    } catch (error) {
      console.error('Error cropping image:', error)
      toast.error('Failed to crop image')
    }
  }, [cropData, originalImage, cropImageUrl])

  const handleCropCancel = useCallback(() => {
    setShowCropDialog(false)
    if (cropImageUrl) {
      URL.revokeObjectURL(cropImageUrl)
      setCropImageUrl(null)
    }
  }, [cropImageUrl])

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

        // Call the onUploadSuccess callback if provided
        if (onUploadSuccess) {
          await onUploadSuccess()
        }

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
    setCroppedFile(null)
    setPreview(event.coverImageUrl || null)
    if (selectedFile && preview && preview !== event.coverImageUrl) {
      URL.revokeObjectURL(preview)
    }
  }

  const contentElement = (
    <div className="space-y-4">
      <div className="space-y-2">
        {!hideCard && <Label>Current Cover Image</Label>}

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Cover preview"
              className="w-full h-auto object-contain rounded-lg border max-h-80"
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
    </div>
  )

  if (hideCard) {
    return (
      <>
        {contentElement}

        {/* Crop Dialog */}
        {console.log('🎭 Rendering crop dialog, showCropDialog:', showCropDialog, 'cropImageUrl:', cropImageUrl)}
        <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crop className="h-5 w-5" />
                Crop Cover Image
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Adjust the crop area to set the focal point of your cover image. This will determine how the image is displayed in your gallery.
              </p>

              {cropImageUrl && (
                <div className="flex justify-center">
                  <Cropper.Root
                    className="h-80 w-full relative flex cursor-move touch-none items-center justify-center overflow-hidden rounded-md border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    image={cropImageUrl}
                    aspectRatio={16 / 9} // Good aspect ratio for cover images
                    onCropChange={setCropData}
                  >
                    <Cropper.Description className="sr-only">
                      Use mouse wheel to zoom, drag to pan, or use arrow keys to move the image
                    </Cropper.Description>
                    <Cropper.Image className="pointer-events-none h-full w-full select-none object-cover" />
                    <Cropper.CropArea className="pointer-events-none absolute border-2 border-dashed border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]" />
                  </Cropper.Root>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCropCancel}>
                Cancel
              </Button>
              <Button onClick={handleCropComplete} disabled={!cropData}>
                <Crop className="w-4 h-4 mr-2" />
                Apply Crop
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
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
        {contentElement}
      </CardContent>

      {/* Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="h-5 w-5" />
              Crop Cover Image
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Adjust the crop area to set the focal point of your cover image. This will determine how the image is displayed in your gallery.
            </p>

            {cropImageUrl && (
              <div className="flex justify-center">
                <Cropper.Root
                  className="h-80 w-full relative flex cursor-move touch-none items-center justify-center overflow-hidden rounded-md border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  image={cropImageUrl}
                  aspectRatio={16 / 9} // Good aspect ratio for cover images
                  onCropChange={setCropData}
                >
                  <Cropper.Description className="sr-only">
                    Use mouse wheel to zoom, drag to pan, or use arrow keys to move the image
                  </Cropper.Description>
                  <Cropper.Image className="pointer-events-none h-full w-full select-none object-cover" />
                  <Cropper.CropArea className="pointer-events-none absolute border-2 border-dashed border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]" />
                </Cropper.Root>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCropCancel}>
              Cancel
            </Button>
            <Button onClick={handleCropComplete} disabled={!cropData}>
              <Crop className="w-4 h-4 mr-2" />
              Apply Crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}