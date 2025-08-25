import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getSession, getSessionAfterNavigation } from "@/lib/auth-session-helpers"
import Image from "next/image"
import { canUserAccessEvent } from "@/lib/auth-helpers"
import { getCachedEventData, getCachedGalleryData } from "@/lib/gallery-cache"
import { GalleryView } from "@/components/gallery/gallery-view"
import { GalleryWithWelcome } from "@/components/gallery/gallery-with-welcome"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Eye, Camera, MessageSquare, Mic } from "lucide-react"
import { parseOnboardingState } from "@/types/onboarding"
import { ContinueSetupCard } from "@/components/onboarding/continue-setup-card"

interface GalleryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Cache this page for 10 minutes to dramatically reduce lambda executions
// New uploads will show every 10 minutes when cache expires
export const revalidate = 600 // 10 minutes

export default async function GalleryPage({ params, searchParams }: GalleryPageProps) {
  const { slug } = await params
  const searchParamsData = await searchParams
  
  // Check if current user has access to this event (owner or organization member)
  // If coming from onboarding navigation, get fresh session to avoid stale cache
  const continueOnboarding = searchParamsData.continueOnboarding === 'true'
  const session = continueOnboarding 
    ? await getSessionAfterNavigation() // Fresh DB lookup for navigation scenarios
    : await getSession() // Use cookie cache for performance

  // Get cached event data
  const eventWithAlbums = await getCachedEventData(slug, false) // We'll check access separately
  
  if (!eventWithAlbums) {
    notFound()
  }

  const isOwner = session?.user?.id === eventWithAlbums.userId
  const hasEventAccess = session?.user ? await canUserAccessEvent(eventWithAlbums.id, session.user.id) : false

  // Parse onboarding state for checking completion
  let onboardingState = parseOnboardingState(eventWithAlbums.quickStartProgress)
  
  // Initialize onboarding if missing and user is owner
  if (!onboardingState && isOwner) {
    // Create a minimal onboarding state to show the continuation card
    onboardingState = {
      onboardingActive: true,
      onboardingComplete: false,
      onboardingSkipped: false,
      currentStep: 3, // Since we're coming from step 2
      completedSteps: ['test-images', 'cover-photo'], // Assume first two steps done if on gallery
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
  
  // Don't redirect to onboarding - allow users to view gallery during onboarding
  // They can navigate back to onboarding using the ContinueSetupCard if needed

  // Get cached gallery data
  const galleryData = await getCachedGalleryData(eventWithAlbums.id, hasEventAccess)


  // If gallery is not published and user doesn't have access, show draft message
  if (!eventWithAlbums.isPublished && !hasEventAccess) {
    return (
      <div className="min-h-screen bg-pink-50/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            {/* Cover Image */}
            {eventWithAlbums.coverImageUrl && (
              <div className="relative mb-8 h-64 rounded-lg shadow-md overflow-hidden">
                <Image
                  src={eventWithAlbums.coverImageUrl}
                  alt={`${eventWithAlbums.coupleNames} - ${eventWithAlbums.name}`}
                  fill
                  className="object-cover opacity-75"
                  sizes="(max-width: 768px) 100vw, 672px"
                />
              </div>
            )}
            
            {/* Event Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{eventWithAlbums.coupleNames}</h1>
              <p className="text-lg text-gray-600 mb-4">{eventWithAlbums.name}</p>
              <p className="text-gray-500">
                {new Date(eventWithAlbums.eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* Draft Message */}
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                  <Eye className="w-8 h-8 text-pink-500" />
                </div>
                <CardTitle className="text-xl text-gray-900">Gallery Coming Soon</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  This gallery is currently being prepared by the hosts. Check back soon to view and share photos from this special celebration!
                </p>
                
                {eventWithAlbums.activationDate && (
                  <div className="p-3 rounded-lg bg-pink-50 border border-pink-200">
                    <p className="text-sm text-pink-800">
                      <strong>Expected to go live:</strong><br />
                      {new Date(eventWithAlbums.activationDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                
                <p className="text-sm text-gray-500">
                  Bookmark this page to easily return when the gallery is ready.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // If guest viewing is disabled and user doesn't have access, show privacy message
  if (!eventWithAlbums.guestCanViewAlbum && !hasEventAccess) {
    return (
      <div className="min-h-screen bg-pink-50/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            {/* Cover Image */}
            {eventWithAlbums.coverImageUrl && (
              <div className="relative mb-8 h-64 rounded-lg shadow-md overflow-hidden">
                <Image
                  src={eventWithAlbums.coverImageUrl}
                  alt={`${eventWithAlbums.coupleNames} - ${eventWithAlbums.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                />
              </div>
            )}
            
            {/* Event Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{eventWithAlbums.coupleNames}</h1>
              <p className="text-lg text-gray-600 mb-4">{eventWithAlbums.name}</p>
              <p className="text-gray-500">
                {new Date(eventWithAlbums.eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* Privacy Message */}
            <Card className="max-w-lg mx-auto">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Looking for photos?</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="space-y-3">
                  <p className="text-gray-700 text-lg leading-relaxed">
                    If you are seeing this message it means the album host has decided to keep the photos and videos <strong>private at this time</strong>.
                  </p>
                  <p className="text-gray-600">
                    The host encourages everyone to please <strong>continue to upload all the moments</strong> they have captured and the host will decide later if and when they are going to share.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Button asChild className="w-full h-14 text-lg font-semibold bg-rose-500 hover:bg-rose-600 text-white">
                    <a href={`/gallery/${slug}/upload`}>
                      <Camera className="w-6 h-6 mr-3" />
                      Upload Media
                    </a>
                  </Button>
                  <Button 
                    disabled
                    className="w-full h-14 text-lg font-semibold bg-gray-400 hover:bg-gray-500 text-white opacity-50"
                  >
                    <MessageSquare className="w-6 h-6 mr-3" />
                    Leave a Message (Coming Soon)
                  </Button>
                  <Button 
                    asChild
                    className="w-full h-14 text-lg font-semibold bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    <a href={`/gallery/${slug}/voice`}>
                      <Mic className="w-6 h-6 mr-3" />
                      Leave a Voicemail
                    </a>
                  </Button>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mt-6">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    <strong>Your contributions matter!</strong> Photos and messages you share will be visible to the hosts immediately. 
                    The hosts may choose to make the gallery public later so everyone can enjoy the memories together.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-background">
      {/* Owner/Member badge */}
      {hasEventAccess && (
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
      )}

      <GalleryWithWelcome
        event={eventWithAlbums as any}
        uploads={galleryData.uploads as any}
        pendingUploads={galleryData.pendingUploads as any}
        eventSlug={slug}
        isOwner={isOwner}
        hasEventAccess={hasEventAccess}
        showWelcomeOnLoad={continueOnboarding}
        onboardingStep={onboardingState?.currentStep || 3}
        continuationCard={isOwner && onboardingState?.onboardingActive && !onboardingState?.onboardingComplete && !onboardingState?.onboardingSkipped ? (
          <ContinueSetupCard
            eventId={eventWithAlbums.id}
            eventSlug={slug}
            eventName={eventWithAlbums.name}
            onboardingState={onboardingState}
          />
        ) : undefined}
      />
    </div>
  )
}