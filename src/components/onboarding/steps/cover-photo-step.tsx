"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, Image as ImageIcon, X, Camera, Loader2, Eye } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { CheckCircle } from "lucide-react"
import { type OnboardingState } from "@/types/onboarding"
import { updateOnboardingProgress, completeOnboardingStep } from "@/app/actions/onboarding"
import { useEventData, eventKeys } from "@/hooks/use-onboarding"
import { useQueryClient } from "@tanstack/react-query"

interface CoverPhotoStepProps {
  eventId: string
  eventSlug: string
  eventName: string
  state: OnboardingState
  onUpdate: (updates: Partial<OnboardingState>) => void
  onComplete: () => Promise<any>
}

// Onboarding-specific cover image upload component
function OnboardingCoverImageUpload({ event, eventId }: { event: any, eventId: string }) {
  console.log('🖼️ OnboardingCoverImageUpload RENDER:', {
    event,
    eventId,
    coverImageUrl: event?.coverImageUrl
  })
  
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(event.coverImageUrl || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const queryClient = useQueryClient()
  
  console.log('🖼️ OnboardingCoverImageUpload STATE:', {
    isUploading,
    preview,
    hasSelectedFile: !!selectedFile,
    selectedFileName: selectedFile?.name
  })

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
        
        // Update onboarding state to mark cover photo step as complete
        try {
          await completeOnboardingStep(eventId, 'cover-photo')
          await updateOnboardingProgress(eventId, {
            coverPhotoSet: true,
            coverPhotoUploaded: true
          })
        } catch (onboardingError) {
          console.error('Failed to update onboarding progress:', onboardingError)
        }
        
        // Invalidate React Query cache to refresh data
        queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) })
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
    console.log('🖼️ OnboardingCoverImageUpload: REMOVING cover image')
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
      console.log('🖼️ Remove response:', result)

      if (result.success) {
        toast.success('Cover image removed successfully!')
        setPreview(null)
        setSelectedFile(null)
        
        // Update onboarding state to mark cover photo step as incomplete
        try {
          await updateOnboardingProgress(eventId, {
            coverPhotoSet: false,
            coverPhotoUploaded: false
          })
        } catch (onboardingError) {
          console.error('Failed to update onboarding progress:', onboardingError)
        }
        
        console.log('🖼️ Invalidating React Query cache:', eventKeys.detail(eventId))
        // Invalidate React Query cache to refresh data
        queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('🖼️ Cover image removal failed:', error)
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
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center">
          <ImageIcon className="mr-2 h-5 w-5" />
          Gallery Cover Image
        </Label>
          
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
    </div>
  )
}

export function CoverPhotoStep({
  eventId,
  eventSlug,
  eventName,
  state,
  onUpdate,
  onComplete
}: CoverPhotoStepProps) {
  console.log('📸 CoverPhotoStep RENDER:', {
    eventId,
    eventSlug,
    eventName,
    state,
    hasOnUpdate: !!onUpdate,
    hasOnComplete: !!onComplete
  })
  
  const router = useRouter()
  const { data: eventData, isLoading, error } = useEventData(eventId)
  const isComplete = state.coverPhotoSet || state.completedSteps.includes('cover-photo')
  
  console.log('📸 CoverPhotoStep EVENT DATA:', {
    eventData,
    isLoading,
    error: error?.message,
    coverImageUrl: eventData?.coverImageUrl,
    isComplete,
    coverPhotoSet: state?.coverPhotoSet,
    completedSteps: state?.completedSteps
  })

  // Use React Query reactive state updates
  const hasCoverImage = !!eventData?.coverImageUrl
  
  console.log('📸 CoverPhotoStep REACTIVE STATE:', {
    hasCoverImage,
    isComplete,
    shouldMarkComplete: hasCoverImage && !isComplete,
    shouldMarkIncomplete: !hasCoverImage && isComplete && state.coverPhotoSet
  })

  // React Query will handle reactivity - no direct onUpdate calls during render
  // The onboarding state will be updated when React Query invalidates the cache
  // after successful upload/removal operations in OnboardingCoverImageUpload

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

      {/* Use Onboarding-specific Cover Image Upload Component */}
      {(() => {
        console.log('📸 CoverPhotoStep RENDER DECISION:', {
          hasEventData: !!eventData,
          isLoading,
          hasError: !!error,
          eventDataKeys: eventData ? Object.keys(eventData) : []
        })
        
        if (eventData) {
          return (
            <OnboardingCoverImageUpload 
              event={eventData}
              eventId={eventId}
            />
          )
        } else if (isLoading) {
          return (
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">Loading event data...</div>
            </div>
          )
        } else if (error) {
          return (
            <div className="flex items-center justify-center p-8">
              <div className="text-red-500">Error loading event data: {error.message}</div>
            </div>
          )
        } else {
          return (
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">No event data available</div>
            </div>
          )
        }
      })()}

      {/* Show View Gallery button when cover image exists */}
      {eventData?.coverImageUrl && (
        <div className="flex justify-center">
          <Button 
            size="lg" 
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => router.push(`/gallery/${eventSlug}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Gallery
          </Button>
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