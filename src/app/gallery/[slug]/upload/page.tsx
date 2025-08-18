import { notFound } from 'next/navigation'
import { db } from "@/database/db"
import { events, albums } from "@/database/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
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
      {/* Cover Image Header */}
      {event.coverImageUrl && (
        <div className="relative h-48 md:h-64 overflow-hidden">
          <img
            src={event.coverImageUrl}
            alt={`${event.coupleNames} - ${event.name}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                Share Your Photos
              </h1>
              <p className="text-sm md:text-base opacity-90">
                {event.coupleNames} • {event.name}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Owner badge */}
      {isOwner && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="container mx-auto px-4 py-2">
            <p className="text-sm text-yellow-800 flex items-center justify-center gap-2">
              <span className="text-yellow-600">👑</span>
              <strong>Gallery Owner:</strong> You can upload photos anytime and manage your gallery.
            </p>
          </div>
        </div>
      )}
      
      <UploadInterface 
        event={eventWithAlbums}
        uploadWindowOpen={uploadWindowOpen}
        isOwner={isOwner}
      />
    </div>
  )
}