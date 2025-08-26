import { notFound } from 'next/navigation'
import { getOptimizedImageUrl } from "@/lib/cloudflare-image"
import { getCachedEventData, getCachedGalleryData } from "@/lib/gallery-cache"
import { GalleryView } from "@/components/gallery/gallery-view"
import { GalleryWithWelcome } from "@/components/gallery/gallery-with-welcome"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Eye, Camera, MessageSquare, Mic } from "lucide-react"
import { GalleryAuthWrapper } from "@/components/gallery/gallery-auth-wrapper"
import { GalleryRefreshHandler } from "@/components/gallery/gallery-refresh-handler"
import { GalleryPageWrapper } from "@/components/gallery/gallery-page-wrapper"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { canUserAccessEvent } from "@/lib/auth-helpers"
import { parseOnboardingState } from "@/types/onboarding"
import { ContinueSetupCard } from "@/components/onboarding/continue-setup-card"

interface GalleryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Dynamic route for real-time privacy control updates
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  // Server-side auth check - Better Auth best practice
  const session = await auth.api.getSession({
    headers: await headers()
  })

  // Get event data
  const eventWithAlbums = await getCachedEventData(slug, false)
  
  if (!eventWithAlbums) {
    notFound()
  }

  // Server-side access check for authenticated users
  let hasEventAccess = false
  let isOwner = false
  
  if (session?.user) {
    hasEventAccess = await canUserAccessEvent(eventWithAlbums.id, session.user.id)
    isOwner = eventWithAlbums.userId === session.user.id
  }

  console.log(`🔍 Gallery access check: guestCanViewAlbum=${eventWithAlbums.guestCanViewAlbum}, hasEventAccess=${hasEventAccess}, isOwner=${isOwner}, session=${!!session?.user}`)

  // Get gallery data with proper access level
  const galleryData = await getCachedGalleryData(eventWithAlbums.id, hasEventAccess)

  // Parse onboarding state for owner continuation card
  const onboardingState = isOwner ? parseOnboardingState(eventWithAlbums.quickStartProgress) : null
  
  console.log(`🚀 Onboarding state for ${isOwner ? 'owner' : 'non-owner'}:`, {
    isOwner,
    hasOnboardingState: !!onboardingState,
    onboardingActive: onboardingState?.onboardingActive,
    onboardingComplete: onboardingState?.onboardingComplete,
    onboardingSkipped: onboardingState?.onboardingSkipped,
    currentStep: onboardingState?.currentStep,
    shouldShowCard: isOwner && onboardingState?.onboardingActive && !onboardingState?.onboardingComplete && !onboardingState?.onboardingSkipped
  })

  // If gallery is not published and user doesn't have access, show draft message
  if (!eventWithAlbums.isPublished && !hasEventAccess) {
    return (
      <GalleryPageWrapper eventData={eventWithAlbums} eventSlug={slug}>
        <div className="min-h-screen bg-background">
          <GalleryRefreshHandler />
          <div className="min-h-screen bg-pink-50/30">
            <div className="container mx-auto px-4 py-8">
              <div className="max-w-2xl mx-auto text-center">
                {/* Cover Image */}
                {eventWithAlbums.coverImageUrl && (
                  <div className="relative mb-8 h-64 rounded-lg shadow-md overflow-hidden">
                    <img
                      src={getOptimizedImageUrl(eventWithAlbums.coverImageUrl)}
                      alt={`${eventWithAlbums.coupleNames} - ${eventWithAlbums.name}`}
                      className="w-full h-full object-cover opacity-75"
                      loading="eager"
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
        </div>
      </GalleryPageWrapper>
    )
  }

  // If guest viewing is disabled and user doesn't have access, show privacy message
  if (!eventWithAlbums.guestCanViewAlbum && !hasEventAccess) {
    return (
      <GalleryPageWrapper eventData={eventWithAlbums} eventSlug={slug}>
        <div className="min-h-screen bg-background">
          <GalleryRefreshHandler />
          <div className="min-h-screen bg-pink-50/30">
            <div className="container mx-auto px-4 py-8">
              <div className="max-w-2xl mx-auto text-center">
                {/* Cover Image */}
                {eventWithAlbums.coverImageUrl && (
                  <div className="relative mb-8 h-64 rounded-lg shadow-md overflow-hidden">
                    <img
                      src={getOptimizedImageUrl(eventWithAlbums.coverImageUrl)}
                      alt={`${eventWithAlbums.coupleNames} - ${eventWithAlbums.name}`}
                      className="w-full h-full object-cover"
                      loading="eager"
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
        </div>
      </GalleryPageWrapper>
    )
  }
  
  // Show the gallery - user has access or it's public
  return (
    <GalleryPageWrapper eventData={eventWithAlbums} eventSlug={slug}>
      <div className="min-h-screen bg-background">
        <GalleryRefreshHandler />
        
        {/* Show owner/member badge for authenticated users with access */}
        {hasEventAccess && (
          <div className={`border-b ${isOwner ? 'bg-secondary border-border' : 'bg-accent border-border'}`}>
            <div className="container mx-auto px-4 py-2">
              <p className={`text-sm ${isOwner ? 'text-secondary-foreground' : 'text-accent-foreground'} flex items-center justify-center gap-2`}>
                <span className="text-primary">
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
          pendingUploads={hasEventAccess ? galleryData.pendingUploads : []}
          eventSlug={slug}
          isOwner={isOwner}
          hasEventAccess={hasEventAccess}
          showWelcomeOnLoad={false}
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
    </GalleryPageWrapper>
  )
}