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
  // Use Better Auth's useSession directly - it's already optimized with nanostore
  const { data: session, isPending } = authClient.useSession()
  const [hasEventAccess, setHasEventAccess] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [checkedSessionId, setCheckedSessionId] = useState<string | null>(null)

  console.log(`🎬 GalleryAuthWrapper render - Session: ${!!session?.user}, SessionPending: ${isPending}, CheckingAccess: ${checkingAccess}, HasAccess: ${hasEventAccess}, CheckedSessionId: ${checkedSessionId}`)

  useEffect(() => {
    async function checkAccess() {
      const sessionId = session?.user?.id || null
      console.log(`🔄 Starting access check for session: ${sessionId}`)
      
      // If we've already checked this session, don't check again
      if (sessionId && checkedSessionId === sessionId) {
        console.log(`✅ Already checked session ${sessionId}, skipping`)
        return
      }
      
      setCheckingAccess(true)
      
      if (!sessionId) {
        console.log(`❌ No session user, setting hasEventAccess: false`)
        setHasEventAccess(false)
        setCheckingAccess(false)
        setCheckedSessionId(null)
        return
      }

      try {
        // Check if user has access to this event (owner or org member)
        console.log(`🔍 Checking access for user ${sessionId} to event ${eventId}`)
        const response = await fetch(`/api/events/${eventId}/access`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log(`✅ Access check result:`, data)
          setHasEventAccess(data.hasAccess)
        } else {
          console.log(`❌ Access check failed with status: ${response.status}`)
          setHasEventAccess(false)
        }
      } catch (error) {
        console.error('💥 Error checking event access:', error)
        setHasEventAccess(false)
      } finally {
        console.log(`🏁 Access check complete for session ${sessionId}`)
        setCheckingAccess(false)
        setCheckedSessionId(sessionId)
      }
    }

    checkAccess()
  }, [session?.user?.id, eventId, checkedSessionId])

  // Show default content while checking auth OR while session is loading
  // Also wait for access check to complete if we have a session
  if (isPending || (session?.user && checkingAccess)) {
    console.log(`⏳ Showing loading state - isPending: ${isPending}, sessionUser: ${!!session?.user}, checkingAccess: ${checkingAccess}`)
    // Show a loading overlay instead of the default content for authenticated users
    if (session?.user && checkingAccess) {
      console.log(`🌀 Showing loading spinner for authenticated user`)
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading gallery...</p>
          </div>
        </div>
      )
    }
    console.log(`📄 Showing default content during loading`)
    return defaultContent
  }

  // No session - show default public view
  if (!session?.user) {
    console.log(`🚫 No session user - showing default content`)
    return defaultContent
  }

  // Session exists but no access - show default public view  
  if (!hasEventAccess) {
    console.log(`🚫 Session exists but no access (hasEventAccess: ${hasEventAccess}) - showing default content`)
    return defaultContent
  }

  // User has access - show enhanced view with owner/member features
  console.log(`🎉 User has access! Showing enhanced view`)
  const isOwner = eventData?.userId === session.user.id
  console.log(`👑 IsOwner: ${isOwner} (eventData.userId: ${eventData?.userId}, session.user.id: ${session.user.id})`)

  // If we have full event and gallery data, show the enhanced view
  if (eventData && galleryData) {
    console.log(`📊 Have eventData and galleryData - showing full enhanced view`)
  
  
  } else {
    console.log(`⚠️  Missing data - eventData: ${!!eventData}, galleryData: ${!!galleryData}`)
  }
  
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