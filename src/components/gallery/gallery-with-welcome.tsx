"use client"

import { useEffect } from "react"
import { useQueryStates } from "nuqs"
import { galleryParams, galleryUrlKeys } from "@/lib/gallery-params"
import { GalleryView } from "./gallery-view"
import { WelcomeDialog } from "./welcome-dialog"

type UIMode = 'GUEST_UI' | 'OWNER_UI' | 'AUTH_UI'

interface GalleryWithWelcomeProps {
  event: any
  uploads: any[]
  pendingUploads: any[]
  eventSlug: string
  isOwner: boolean
  hasEventAccess: boolean
  continuationCard?: React.ReactNode
  showWelcomeOnLoad?: boolean
  onboardingStep?: number
  forcePublicView?: boolean
  guestbookEntries?: any[]
  isGuestOwnContent?: boolean
  uiMode?: UIMode
}

export function GalleryWithWelcome({
  event,
  uploads,
  pendingUploads,
  eventSlug,
  isOwner,
  hasEventAccess,
  continuationCard,
  showWelcomeOnLoad = false,
  onboardingStep = 3,
  forcePublicView = false,
  guestbookEntries = [],
  isGuestOwnContent = false,
  uiMode = 'GUEST_UI'
}: GalleryWithWelcomeProps) {
  const [galleryState, setGalleryState] = useQueryStates(galleryParams, {
    urlKeys: galleryUrlKeys,
    history: 'replace',
    shallow: true,
  })

  // Show welcome dialog if continueOnboarding param was present and user is owner
  useEffect(() => {
    if (showWelcomeOnLoad && isOwner && !galleryState.showWelcome) {
      setGalleryState({
        showWelcome: true,
        welcomeStep: onboardingStep
      })
    }
  }, [showWelcomeOnLoad, isOwner, galleryState.showWelcome, onboardingStep, setGalleryState])

  const handleCloseWelcome = async () => {
    await setGalleryState({
      showWelcome: false
    })
  }

  return (
    <>
      <GalleryView
        event={event}
        uploads={uploads}
        pendingUploads={pendingUploads}
        eventSlug={eventSlug}
        isOwner={isOwner}
        hasEventAccess={hasEventAccess}
        continuationCard={continuationCard}
        forcePublicView={forcePublicView}
        guestbookEntries={guestbookEntries}
        isGuestOwnContent={isGuestOwnContent}
        uiMode={uiMode}
      />
      
      <WelcomeDialog
        open={galleryState.showWelcome}
        onClose={handleCloseWelcome}
        eventName={event.name}
        eventSlug={eventSlug}
        currentStep={galleryState.welcomeStep}
      />
    </>
  )
}