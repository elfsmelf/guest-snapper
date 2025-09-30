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
import { eventKeys } from "@/hooks/use-onboarding"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CoverImageUpload } from "@/components/cover-image-upload"

interface CoverPhotoStepProps {
  eventId: string
  eventSlug: string
  eventName: string
  state: OnboardingState
  onUpdate: (updates: Partial<OnboardingState>) => void
  onComplete: () => Promise<any>
}

// Extended version of CoverImageUpload that includes onboarding state updates
function OnboardingCoverImageUpload({ event, eventId }: { event: any, eventId: string }) {
  const queryClient = useQueryClient()

  const handleUploadSuccess = useCallback(async () => {
    try {
      await completeOnboardingStep(eventId, 'cover-photo')
      await updateOnboardingProgress(eventId, {
        coverPhotoSet: true,
        coverPhotoUploaded: true
      })
      // Invalidate React Query cache to refresh data
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) })
    } catch (onboardingError) {
      console.error('Failed to update onboarding progress:', onboardingError)
    }
  }, [eventId, queryClient])

  return (
    <CoverImageUpload
      event={event}
      onUploadSuccess={handleUploadSuccess}
      hideCard={true}
    />
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
  // Use React Query with proper refetch settings for cover photo step
  const { data: eventData, isLoading, error } = useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) throw new Error('Failed to fetch event data')
      return response.json()
    },
    staleTime: 0, // Always consider data stale for cover photo step
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
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