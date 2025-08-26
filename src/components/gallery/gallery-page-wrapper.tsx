"use client"

import { authClient } from "@/lib/auth-client"
import { Header } from "@/components/header"
import { PublicGalleryHeader } from "@/components/public-gallery-header"
import { parseOnboardingState } from "@/types/onboarding"
import { GuestTrackingProvider } from "@/components/guest-tracking-provider"

interface GalleryPageWrapperProps {
  children: React.ReactNode
  eventData: any
  eventSlug: string
  forcePublicView?: boolean
}

/**
 * Client wrapper that adds the appropriate header based on auth state
 */
export function GalleryPageWrapper({ children, eventData, eventSlug, forcePublicView = false }: GalleryPageWrapperProps) {
  const { data: session, isPending } = authClient.useSession()
  const themeId = eventData.themeId || 'default'
  
  // Determine if user is owner
  const isOwner = session?.user?.id === eventData.userId
  let onboardingState = null
  
  if (isOwner) {
    onboardingState = parseOnboardingState(eventData.quickStartProgress)
  }
  
  return (
    <GuestTrackingProvider forcePublicView={forcePublicView}>
      {/* Show appropriate header based on auth state */}
      {isPending ? (
        // Loading state - show public header to prevent shift
        <PublicGalleryHeader 
          galleryTheme={themeId} 
          eventSlug={eventSlug}
          showAuthButtons={true}
        />
      ) : session?.user ? (
        // Authenticated user - show full header
        <Header 
          galleryTheme={themeId} 
          eventSlug={eventSlug}
          showOnboardingSetup={isOwner && onboardingState?.onboardingActive && !onboardingState?.onboardingComplete && !onboardingState?.onboardingSkipped}
          onboardingStep={onboardingState?.currentStep}
        />
      ) : (
        // Anonymous user - show public header
        <PublicGalleryHeader 
          galleryTheme={themeId} 
          eventSlug={eventSlug}
          showAuthButtons={true}
        />
      )}
      
      {/* Gallery content */}
      {children}
    </GuestTrackingProvider>
  )
}