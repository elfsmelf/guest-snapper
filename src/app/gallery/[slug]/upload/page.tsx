import { notFound } from 'next/navigation'
import { db } from "@/database/db"
import { events, albums, uploads } from "@/database/schema"
import { eq, and, count, isNull } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { UploadInterface } from "@/components/upload/upload-interface"
import { GuestTrackingProvider } from "@/components/guest-tracking-provider"

interface UploadPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function UploadPage({ params, searchParams }: UploadPageProps) {
  const { slug } = await params
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
    })
    .from(albums)
    .where(eq(albums.eventId, event.id))
    .orderBy(albums.sortOrder)

  // Check if user is authenticated (for ownership detection) 
  const session = await auth.api.getSession({
    headers: await headers()
  })

  const isOwner = session?.user?.id === event.userId
  
  // Determine if user should see album counts (only for public galleries or owners/members)
  const shouldShowCounts = event.guestCanViewAlbum || (isOwner && !forcePublicView)

  // Get upload counts for each album (only if authorized)
  const albumsWithCounts = await Promise.all(
    albumsResult.map(async (album) => {
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

  const uploadWindowOpen = isOwner || new Date(event.uploadWindowEnd) > new Date()

  return (
    <GuestTrackingProvider forcePublicView={forcePublicView}>
      <div className="min-h-screen bg-background">
        {/* Compact Cover Image Header with Nav Overlay */}
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
        
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/20"
          >
            <Link href={`/gallery/${slug}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Gallery
            </Link>
          </Button>
        </div>
        
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
    {isOwner && !forcePublicView && (
      <div className="bg-secondary border-b border-border">
        <div className="container mx-auto px-4 py-2">
          <p className="text-xs text-secondary-foreground flex items-center justify-center gap-1">
            <span className="text-primary">👑</span>
            <strong>Owner</strong> - Upload anytime
          </p>
        </div>
      </div>
    )}
    
        <UploadInterface 
          event={eventWithAlbums}
          uploadWindowOpen={uploadWindowOpen}
          isOwner={isOwner}
          guestCanUpload={event.guestCanViewAlbum ?? false}
          forcePublicView={forcePublicView}
          shouldShowCounts={shouldShowCounts}
        />
      </div>
    </GuestTrackingProvider>
  )
}