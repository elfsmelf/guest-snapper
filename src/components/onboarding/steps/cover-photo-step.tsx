"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Upload, Camera, X, CheckCircle, Loader2, Sparkles, Image as ImageIcon } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { type OnboardingState } from "@/types/onboarding"
import { updateOnboardingProgress } from "@/app/actions/onboarding"

interface CoverPhotoStepProps {
  eventId: string
  eventSlug: string
  eventName: string
  state: OnboardingState
  onUpdate: (updates: Partial<OnboardingState>) => void
  onComplete: () => Promise<any>
}

export function CoverPhotoStep({
  eventId,
  eventSlug,
  eventName,
  state,
  onUpdate,
  onComplete
}: CoverPhotoStepProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentCoverImage, setCurrentCoverImage] = useState<string | null>(null)
  const isComplete = state.coverPhotoSet || state.completedSteps.includes('cover-photo')

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
          eventId: eventId,
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
      const updateResponse = await fetch(`/api/events/${eventId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverImageUrl: urlResult.fileUrl
        })
      })

      const updateResult = await updateResponse.json()

      if (updateResult.success) {
        toast.success('Cover image uploaded successfully!')
        setSelectedFile(null)
        setCurrentCoverImage(urlResult.fileUrl)
        
        // Optimistically update URL state first
        await onUpdate({
          coverPhotoSet: true,
          completedSteps: [...state.completedSteps.filter(s => s !== 'cover-photo'), 'cover-photo']
        })
        
        // Then update database
        const result = await updateOnboardingProgress(eventId, {
          coverPhotoSet: true
        })
        
        if (result.success) {
          await onComplete()
        }
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

  const clearSelection = () => {
    if (selectedFile && preview && !currentCoverImage) {
      URL.revokeObjectURL(preview)
    }
    setSelectedFile(null)
    setPreview(currentCoverImage)
  }

  return (
    <div className="space-y-6">
      {/* Step Introduction */}
      <div className="text-center space-y-3">
        <p className="text-muted-foreground">
          Choose a stunning cover photo that represents your {eventName}. This will be the first thing guests see when they visit your gallery!
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 border-t border-muted-foreground/20"></div>
        <span className="text-sm font-medium text-muted-foreground">STEP 2</span>
        <div className="flex-1 border-t border-muted-foreground/20"></div>
      </div>

      {isComplete ? (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Perfect! Your cover photo is set
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your gallery now has a beautiful header image that guests will love!
                  </p>
                </div>
              </div>
              {preview && (
                <img
                  src={preview}
                  alt="Cover photo"
                  className="w-full h-64 object-cover rounded-lg border"
                />
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Upload Interface */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Gallery Cover Image</Label>
            
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Cover preview"
                  className="w-full h-64 object-cover rounded-lg border"
                />
                <div className="absolute top-2 right-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={clearSelection}
                    disabled={isUploading}
                    title="Clear selection"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                  ${isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-300 hover:border-gray-400'
                  }
                  ${isUploading ? 'pointer-events-none opacity-50' : ''}
                `}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center">
                  <div className="bg-card mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </div>
                  {isDragActive ? (
                    <p className="text-primary font-medium">Drop your cover image here!</p>
                  ) : (
                    <div>
                      <p className="font-medium mb-2">
                        Drag & drop a cover image here
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        or click to browse your device
                      </p>
                      <Button variant="outline">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Choose Image
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-4">
                    JPG, PNG, WebP up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
              <Button onClick={handleUpload} disabled={isUploading} size="sm">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Set Cover Photo
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="font-medium mb-2">💡 Pro Tips:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Choose a high-quality image that represents your event perfectly</li>
          <li>• Landscape orientation works best for cover photos</li>
          <li>• Consider images with good lighting and clear subject matter</li>
          <li>• This image will appear at the top of your gallery for all guests</li>
        </ul>
      </div>
    </div>
  )
}