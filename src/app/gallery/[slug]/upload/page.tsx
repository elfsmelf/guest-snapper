import { notFound } from 'next/navigation'
import { db } from "@/database/db"
import { events, albums } from "@/database/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import Image from "next/image"
import { UploadInterface } from "@/components/upload/upload-interface"

interface UploadPageProps {
  params: Promise<{ slug: string }>
}

export default async function UploadPage({ params }: UploadPageProps) {
  const { slug } = await params

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

  const eventWithAlbums = {
    ...event,
    albums: albumsResult,
  }

  // Check if user is authenticated (for ownership detection)
  const session = await auth.api.getSession({
    headers: await headers()
  })

  const isOwner = session?.user?.id === event.userId
  const uploadWindowOpen = isOwner || new Date(event.uploadWindowEnd) > new Date()

  return (
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
    
    {/* Owner badge - more compact */}
    {isOwner && (
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
      />
    </div>
  )
}