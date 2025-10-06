import { notFound, redirect } from 'next/navigation'
import { db } from "@/database/db"
import { events, albums, uploads } from "@/database/schema"
import { eq, and, count, isNull } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import Image from "next/image"
import Link from "next/link"
import { UploadInterface } from "@/components/upload/upload-interface"
import { GalleryPageWrapper } from "@/components/gallery/gallery-page-wrapper"
import { getTrialStatus } from "@/lib/trial-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { parseLocalDate } from "@/lib/date-utils"

interface UploadPageProps {
  params: Promise<{ lang: string; slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function UploadPage({ params, searchParams }: UploadPageProps) {
  const { slug, lang } = await params
  const search = await searchParams
  const forcePublicView = search?.view === 'public'

  // Get event details by slug
  const eventResult = await db
    .select({
      id: events.id,
      name: events.name,
      coupleNames: events.coupleNames,
      eventDate: events.eventDate,
      slug: events.slug,
      userId: events.userId,
      themeId: events.themeId,
      uploadWindowEnd: events.uploadWindowEnd,
      downloadWindowEnd: events.downloadWindowEnd,
      privacySettings: events.privacySettings,
      moderationSettings: events.moderationSettings,
      coverImageUrl: events.coverImageUrl,
      guestCanViewAlbum: events.guestCanViewAlbum,
      plan: events.plan,
      paidAt: events.paidAt,
      createdAt: events.createdAt,
      isPublished: events.isPublished,
      activationDate: events.activationDate,
    })
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1)

  if (!eventResult.length) {
    notFound()
  }

  const event = eventResult[0]

  // Get albums for this event
  const albumsResult = await db
    .select({
      id: albums.id,
      name: albums.name,
      sortOrder: albums.sortOrder,
      isVisible: albums.isVisible,
      isFavorite: albums.isFavorite,
    })
    .from(albums)
    .where(eq(albums.eventId, event.id))
    .orderBy(albums.sortOrder)

  // Check if user is authenticated (for ownership detection)
  const session = await auth.api.getSession({
    headers: await headers()
  })

  const isOwner = session?.user?.id === event.userId

  // Check if activation date has passed
  const isActivationDatePassed = event.activationDate
    ? parseLocalDate(event.activationDate) <= new Date()
    : true // If no activation date, consider it as passed

  // Redirect to gallery page if gallery is not published OR activation date hasn't passed, and user is not the owner
  if ((!event.isPublished || !isActivationDatePassed) && !isOwner) {
    redirect(`/${lang}/gallery/${slug}`)
  }

  // Also redirect if upload window has ended and user is not the owner
  const uploadWindowOpen = isOwner || new Date(event.uploadWindowEnd) > new Date()
  if (!uploadWindowOpen && !isOwner) {
    redirect(`/${lang}/gallery/${slug}`)
  }

  // Filter albums based on visibility for public users
  const visibleAlbums = (isOwner && !forcePublicView)
    ? albumsResult // Owners see all albums
    : albumsResult.filter(album => album.isVisible) // Public users only see visible albums

  // Determine if user should see album counts (only for public galleries or owners/members)
  const shouldShowCounts = event.guestCanViewAlbum || (isOwner && !forcePublicView)

  // Get upload counts for each album (only if authorized)
  const albumsWithCounts = await Promise.all(
    visibleAlbums.map(async (album) => {
      const uploadCount = shouldShowCounts ? await db
        .select({ count: count() })
        .from(uploads)
        .where(and(
          eq(uploads.eventId, event.id),
          eq(uploads.albumId, album.id),
          eq(uploads.isApproved, true)
        ))
        .then(result => result[0]?.count || 0) : 0

      return {
        ...album,
        uploadsCount: uploadCount
      }
    })
  )

  // Get general (unassigned) photos count (only if authorized)
  const generalCount = shouldShowCounts ? await db
    .select({ count: count() })
    .from(uploads)
    .where(and(
      eq(uploads.eventId, event.id),
      isNull(uploads.albumId),
      eq(uploads.isApproved, true)
    ))
    .then(result => result[0]?.count || 0) : 0

  const eventWithAlbums = {
    ...event,
    albums: albumsWithCounts,
    generalUploadsCount: generalCount,
  }

  // Check trial status
  const trialStatus = getTrialStatus({
    plan: event.plan,
    createdAt: event.createdAt,
    paidAt: event.paidAt
  })

  return (
    <GalleryPageWrapper eventData={event} eventSlug={slug}>
      <div className="min-h-screen bg-background">
        {/* Compact Cover Image Header */}
        {event.coverImageUrl && (
          <div className="relative h-32 md:h-40 overflow-hidden">
            <Image
              src={event.coverImageUrl}
              alt={`${event.coupleNames} - ${event.name}`}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/40" />

            {/* Content Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-xl md:text-2xl font-bold mb-1">
                  Share Your Photos
                </h1>
                <p className="text-sm md:text-base opacity-90">
                  {event.coupleNames} • {event.name}
            </p>
          </div>
        </div>
      </div>
        )}

        {/* Owner badge - more compact (hide when forcing public view) */}
        {isOwner && !forcePublicView && !trialStatus.isExpired && (
          <div className="bg-secondary border-b border-border">
            <div className="container mx-auto px-4 py-2">
              <p className="text-xs text-secondary-foreground flex items-center justify-center gap-1">
                <span className="text-primary">👑</span>
                <strong>Owner</strong> - Upload anytime
              </p>
            </div>
          </div>
        )}

        {/* Expired Trial Alert */}
        {isOwner && trialStatus.isExpired && (
          <div className="container mx-auto px-4 py-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-red-900">Free Trial Expired</p>
                    <p className="text-sm text-red-800 mt-1">
                      You are currently on a free trial. Choose a plan to be able to upload media.
                    </p>
                  </div>
                  <Button asChild size="sm" className="bg-red-600 hover:bg-red-700">
                    <Link href={`/dashboard/events/${event.id}?tab=pricing`}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Choose Your Plan
                    </Link>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Only show upload interface if trial is not expired */}
        {!trialStatus.isExpired && (
          <UploadInterface
            event={eventWithAlbums}
            uploadWindowOpen={uploadWindowOpen}
            isOwner={isOwner}
            guestCanUpload={event.guestCanViewAlbum ?? false}
            forcePublicView={forcePublicView}
            shouldShowCounts={shouldShowCounts}
          />
        )}
      </div>
    </GalleryPageWrapper>
  )
}