import { notFound } from 'next/navigation'
import { getOptimizedImageUrl } from "@/lib/cloudflare-image"
import { getCachedEventData, getCachedGalleryData } from "@/lib/gallery-cache"
import { GalleryView } from "@/components/gallery/gallery-view"
import { GalleryWithWelcome } from "@/components/gallery/gallery-with-welcome"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Eye, EyeOff, Camera, MessageSquare, Mic } from "lucide-react"
import { GalleryAuthWrapper } from "@/components/gallery/gallery-auth-wrapper"
import { GalleryRefreshHandler } from "@/components/gallery/gallery-refresh-handler"
import { GalleryPageWrapper } from "@/components/gallery/gallery-page-wrapper"
import { auth } from "@/lib/auth"
import { headers, cookies } from "next/headers"
import { canUserAccessEvent } from "@/lib/auth-helpers"
import { parseOnboardingState } from "@/types/onboarding"
import { ContinueSetupCard } from "@/components/onboarding/continue-setup-card"
import { PrivateGalleryActions } from "@/components/gallery/private-gallery-actions"
import { determineGalleryAccess } from "@/lib/gallery-access-helpers"

interface GalleryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Dynamic route for real-time privacy control updates
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default async function GalleryPage({ params, searchParams }: GalleryPageProps) {
  const { slug } = await params
  const search = await searchParams
  
  // Check if we should simulate public view
  const forcePublicView = search?.view === 'public'
  
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
  // If forcePublicView is true, treat as if no session exists
  let hasEventAccess = false
  let isOwner = false
  
  if (session?.user && !forcePublicView) {
    hasEventAccess = await canUserAccessEvent(eventWithAlbums.id, session.user.id)
    isOwner = eventWithAlbums.userId === session.user.id
  }

  console.log(`🔍 Gallery access check: guestCanViewAlbum=${eventWithAlbums.guestCanViewAlbum}, hasEventAccess=${hasEventAccess}, isOwner=${isOwner}, session=${!!session?.user}, forcePublicView=${forcePublicView}`)

  // Get guest cookie for unified access logic
  const cookieStore = await cookies()
  const guestCookieId = cookieStore.get('guest_id')?.value || null

  // Use unified access logic
  const accessResult = await determineGalleryAccess({
    eventData: eventWithAlbums,
    isOwner,
    hasEventAccess,
    forcePublicView,
    session,
    guestCookieId
  })

  // Parse onboarding state for owner continuation card (skip if forcing public view)
  const onboardingState = isOwner && !forcePublicView ? parseOnboardingState(eventWithAlbums.quickStartProgress) : null
  
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
      <GalleryPageWrapper eventData={eventWithAlbums} eventSlug={slug} forcePublicView={forcePublicView}>
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

  // Handle private gallery experience or show private message
  if (!accessResult.showAllContent && !accessResult.isGuestOwnContent) {
    // Show the private gallery message (no guest content)
    
    return (
      <GalleryPageWrapper eventData={eventWithAlbums} eventSlug={slug} forcePublicView={forcePublicView}>
        <div className="min-h-screen relative overflow-hidden bg-background">
        <GalleryRefreshHandler />
        
        {/* Hero Section with Cover Image - matching main gallery style */}
        {eventWithAlbums.coverImageUrl && (
          <div className="h-[70vh] relative overflow-hidden">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full"
              style={{
                backgroundImage: `url(${getOptimizedImageUrl(eventWithAlbums.coverImageUrl)})`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/50" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 py-16">
              <div className="flex flex-col items-center text-center max-w-xs mx-auto">
                {/* Names */}
                <div className="mb-6">
                  {(() => {
                    const names = eventWithAlbums.coupleNames?.split(' & ') || eventWithAlbums.coupleNames?.split(' and ') || [eventWithAlbums.coupleNames]
                    if (names.length === 2) {
                      return (
                        <div className="space-y-2">
                          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-wide leading-tight">
                            {names[0]}
                          </h1>
                          <div className="flex items-center justify-center space-x-4">
                            <div className="w-8 h-px bg-white/60"></div>
                            <span className="text-white/80 text-lg font-light">&</span>
                            <div className="w-8 h-px bg-white/60"></div>
                          </div>
                          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-wide leading-tight">
                            {names[1]}
                          </h1>
                        </div>
                      )
                    } else {
                      return (
                        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-wide leading-tight">
                          {eventWithAlbums.coupleNames}
                        </h1>
                      )
                    }
                  })()}
                </div>

                {/* Event Info */}
                <div className="space-y-3 text-white/90 text-center mb-8">
                  <p className="text-lg font-medium">{eventWithAlbums.name}</p>
                  <p className="text-sm opacity-80">
                    {new Date(eventWithAlbums.eventDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {/* Privacy Message */}
                <div className="bg-black/40 backdrop-blur-sm rounded-lg p-6 text-center mb-8">
                  <div className="w-16 h-16 bg-primary/90 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-3">Photos are kept private for now</h2>
                  <p className="text-white/90 text-sm leading-relaxed mb-4">
                    The hosts have decided to keep photos and videos private for now.
                  </p>
                  <p className="text-white/80 text-sm leading-relaxed">
                    But don't worry! You can still share all your amazing moments. The hosts will decide when to make them public.
                  </p>
                </div>

                {/* Action Buttons */}
                <PrivateGalleryActions
                  eventId={eventWithAlbums.id}
                  eventName={eventWithAlbums.name}
                  eventSlug={slug}
                  variant="hero"
                />
              </div>
            </div>
          </div>
        )}

        {/* No Cover Image - matching main gallery fallback style */}
        {!eventWithAlbums.coverImageUrl && (
          <div className="h-[70vh] relative overflow-hidden bg-gradient-to-br from-background via-muted to-secondary/20">
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 py-16">
              <div className="flex flex-col items-center text-center max-w-xs mx-auto">
                {/* Names */}
                <div className="mb-6">
                  {(() => {
                    const names = eventWithAlbums.coupleNames?.split(' & ') || eventWithAlbums.coupleNames?.split(' and ') || [eventWithAlbums.coupleNames]
                    if (names.length === 2) {
                      return (
                        <div className="space-y-2">
                          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-wide leading-tight">
                            {names[0]}
                          </h1>
                          <div className="flex items-center justify-center space-x-4">
                            <div className="w-8 h-px bg-muted-foreground/60"></div>
                            <span className="text-muted-foreground text-lg font-light">&</span>
                            <div className="w-8 h-px bg-muted-foreground/60"></div>
                          </div>
                          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-wide leading-tight">
                            {names[1]}
                          </h1>
                        </div>
                      )
                    } else {
                      return (
                        <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-wide leading-tight">
                          {eventWithAlbums.coupleNames}
                        </h1>
                      )
                    }
                  })()}
                </div>

                {/* Event Info */}
                <div className="space-y-3 text-muted-foreground text-center mb-8">
                  <p className="text-lg font-medium">{eventWithAlbums.name}</p>
                  <p className="text-sm opacity-80">
                    {new Date(eventWithAlbums.eventDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {/* Privacy Message */}
                <div className="bg-muted/50 rounded-lg p-6 text-center border mb-8">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Photos are kept private for now</h2>
                  <p className="text-foreground text-sm leading-relaxed mb-4">
                    The hosts have decided to keep photos and videos private for now.
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    But don't worry! You can still share all your amazing moments. The hosts will decide when to make them public.
                  </p>
                </div>

                {/* Action Buttons */}
                <PrivateGalleryActions
                  eventId={eventWithAlbums.id}
                  eventName={eventWithAlbums.name}
                  eventSlug={slug}
                  variant="hero"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto">
            {/* Privacy Message Card */}
            <Card className="shadow-lg">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-6">
                  <Camera className="w-10 h-10 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">
                  Looking for photos?
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* Explanation Text */}
                <div className="text-center space-y-4">
                  <div className="bg-muted rounded-lg p-6">
                    <p className="text-foreground text-lg leading-relaxed mb-3">
                      The gallery host has decided to keep photos and videos <strong className="text-primary">private for now</strong>.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      But don't worry! You can still <strong>upload all your amazing moments</strong>. The host will decide when to make them public.
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <PrivateGalleryActions
                  eventId={eventWithAlbums.id}
                  eventName={eventWithAlbums.name}
                  eventSlug={slug}
                  variant="card"
                />
                
                {/* Info Box */}
                <div className="bg-accent rounded-lg p-6 border">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground">Your contributions matter!</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Everything you share will be visible to the hosts right away. They may choose to make the gallery public later so everyone can enjoy the memories together.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </GalleryPageWrapper>
    )
  }

  // If guest has own content, show their private gallery view
  if (accessResult.isGuestOwnContent) {
    return (
      <GalleryPageWrapper eventData={eventWithAlbums} eventSlug={slug} forcePublicView={forcePublicView}>
        <div className="min-h-screen bg-background">
          <GalleryRefreshHandler />

          <GalleryView
            event={eventWithAlbums as any}
            uploads={accessResult.content.uploads as any}
            pendingUploads={accessResult.content.pendingUploads as any}
            eventSlug={slug}
            isOwner={false}
            hasEventAccess={false}
            guestbookEntries={accessResult.content.guestbookEntries as any}
            isGuestOwnContent={true}
            uiMode={accessResult.uiMode}
          />
        </div>
      </GalleryPageWrapper>
    )
  }
  
  // Show the gallery - user has access or it's public
  return (
    <GalleryPageWrapper eventData={eventWithAlbums} eventSlug={slug} forcePublicView={forcePublicView}>
      <div className="min-h-screen bg-background">
        <GalleryRefreshHandler />
        
        {/* Show public view indicator when forcing public view */}
        {forcePublicView && session?.user && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/20">
            <div className="container mx-auto px-4 py-2">
              <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center justify-center gap-2">
                <EyeOff className="h-4 w-4" />
                <strong>Public Preview Mode:</strong> You're viewing this gallery as a public visitor would see it
              </p>
            </div>
          </div>
        )}
        
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
          uploads={accessResult.content.uploads as any}
          pendingUploads={accessResult.content.pendingUploads as any}
          eventSlug={slug}
          isOwner={isOwner}
          hasEventAccess={hasEventAccess}
          showWelcomeOnLoad={false}
          onboardingStep={onboardingState?.currentStep || 3}
          forcePublicView={forcePublicView}
          guestbookEntries={accessResult.content.guestbookEntries as any}
          isGuestOwnContent={accessResult.isGuestOwnContent}
          uiMode={accessResult.uiMode}
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