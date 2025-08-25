"use client"

import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { GalleryWithWelcome } from "@/components/gallery/gallery-with-welcome"
import { ContinueSetupCard } from "@/components/onboarding/continue-setup-card"
import { parseOnboardingState } from "@/types/onboarding"

interface GalleryAuthWrapperProps {
  eventId: string
  eventSlug: string
  eventData?: any
  galleryData?: any
  defaultContent: React.ReactNode
}

export function GalleryAuthWrapper({ 
  eventId, 
  eventSlug, 
  eventData,
  galleryData,
  defaultContent 
}: GalleryAuthWrapperProps) {
  const { data: session, isPending } = authClient.useSession()
  const [hasEventAccess, setHasEventAccess] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)

  useEffect(() => {
    async function checkAccess() {
      if (!session?.user?.id) {
        setHasEventAccess(false)
        setCheckingAccess(false)
        return
      }

      try {
        // Check if user has access to this event (owner or org member)
        const response = await fetch(`/api/events/${eventId}/access`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setHasEventAccess(data.hasAccess)
        } else {
          setHasEventAccess(false)
        }
      } catch (error) {
        console.error('Error checking event access:', error)
        setHasEventAccess(false)
      } finally {
        setCheckingAccess(false)
      }
    }

    checkAccess()
  }, [session?.user?.id, eventId])

  // Show default content while checking auth
  if (isPending || checkingAccess) {
    return defaultContent
  }

  // No session or no access - show default public view
  if (!session?.user || !hasEventAccess) {
    return defaultContent
  }

  // User has access - show enhanced view with owner/member features
  const isOwner = eventData?.userId === session.user.id

  // If we have full event and gallery data, show the enhanced view
  if (eventData && galleryData) {
    // Parse onboarding state for owner
    let onboardingState = null
    if (isOwner) {
      onboardingState = parseOnboardingState(eventData.quickStartProgress)
      
      // Initialize onboarding if missing and user is owner
      if (!onboardingState) {
        onboardingState = {
          onboardingActive: true,
          onboardingComplete: false,
          onboardingSkipped: false,
          currentStep: 3,
          completedSteps: ['test-images', 'cover-photo'],
          skippedSteps: [],
          onboardingStartedAt: new Date().toISOString(),
          testImagesUploaded: true,
          testImageCount: 1,
          coverPhotoUploaded: false,
          coverPhotoSet: false,
          privacyConfigured: false,
          themeSelected: false,
          guestCountSet: false,
          paymentCompleted: false,
          eventPublished: false,
          albumsCreated: 0,
          albumIds: [],
          qrDownloaded: false,
          slideshowTested: false,
          collaboratorsInvited: 0,
          collaboratorEmails: [],
          lastActiveStep: 3,
          lastUpdated: new Date().toISOString()
        }
      }
    }

    return (
      <div className="min-h-screen bg-background">
        {/* Owner/Member badge */}
        <div className={`border-b ${isOwner ? 'bg-secondary border-border' : 'bg-accent border-border'}`}>
          <div className="container mx-auto px-4 py-2">
            <p className={`text-sm ${isOwner ? 'text-secondary-foreground' : 'text-accent-foreground'} flex items-center justify-center gap-2`}>
              <span className={isOwner ? 'text-primary' : 'text-primary'}>
                {isOwner ? '👑' : '🤝'}
              </span>
              <strong>{isOwner ? 'Gallery Owner:' : 'Organization Member:'}</strong> You can view and manage this gallery even when public viewing is disabled.
            </p>
          </div>
        </div>

        <GalleryWithWelcome
          event={eventData}
          uploads={galleryData.uploads}
          pendingUploads={hasEventAccess ? galleryData.pendingUploads : []}
          eventSlug={eventSlug}
          isOwner={isOwner}
          hasEventAccess={hasEventAccess}
          showWelcomeOnLoad={false}
          onboardingStep={onboardingState?.currentStep || 3}
          continuationCard={isOwner && onboardingState?.onboardingActive && !onboardingState?.onboardingComplete && !onboardingState?.onboardingSkipped ? (
            <ContinueSetupCard
              eventId={eventId}
              eventSlug={eventSlug}
              eventName={eventData.name}
              onboardingState={onboardingState}
            />
          ) : undefined}
        />
      </div>
    )
  }

  // Just show the badge overlay on top of default content
  return (
    <>
      {/* Owner/Member badge */}
      <div className={`border-b ${isOwner ? 'bg-secondary border-border' : 'bg-accent border-border'}`}>
        <div className="container mx-auto px-4 py-2">
          <p className={`text-sm ${isOwner ? 'text-secondary-foreground' : 'text-accent-foreground'} flex items-center justify-center gap-2`}>
            <span className={isOwner ? 'text-primary' : 'text-primary'}>
              {isOwner ? '👑' : '🤝'}
            </span>
            <strong>{isOwner ? 'Gallery Owner:' : 'Organization Member:'}</strong> You have special access to this gallery.
          </p>
        </div>
      </div>
      {defaultContent}
    </>
  )
}