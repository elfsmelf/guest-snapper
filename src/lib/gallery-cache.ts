import { unstable_cache } from 'next/cache'
import { db } from '@/database/db'
import { uploads, events, albums, guestbookEntries } from '@/database/schema'
import { eq, and, desc, count } from 'drizzle-orm'

interface GalleryData {
  uploads: any[]
  pendingUploads: any[]
  approvedCount: number
  pendingCount: number
  totalCount: number
  hasAccess: boolean
}

// Cached function to fetch gallery data
export const getCachedGalleryData = unstable_cache(
  async (eventId: string, hasAccess: boolean) => {
    // Fetch uploads based on access level
    const uploadsResult = await db
      .select({
        id: uploads.id,
        eventId: uploads.eventId,
        fileName: uploads.fileName,
        fileUrl: uploads.fileUrl,
        fileType: uploads.fileType,
        uploaderName: uploads.uploaderName,
        caption: uploads.caption,
        isApproved: uploads.isApproved,
        createdAt: uploads.createdAt,
        albumId: uploads.albumId,
      })
      .from(uploads)
      .where(
        hasAccess 
          ? eq(uploads.eventId, eventId)
          : and(eq(uploads.eventId, eventId), eq(uploads.isApproved, true))
      )
      .orderBy(desc(uploads.createdAt))

    // Separate into approved and pending
    const approvedUploads = uploadsResult.filter(u => u.isApproved)
    const pendingUploads = hasAccess ? uploadsResult.filter(u => !u.isApproved) : []

    return {
      uploads: approvedUploads,
      pendingUploads,
      approvedCount: approvedUploads.length,
      pendingCount: pendingUploads.length,
      totalCount: uploadsResult.length,
      hasAccess,
    }
  },
  ['gallery-data'],
  {
    tags: ['gallery'],
    revalidate: 30, // Cache for 30 seconds as fallback
  }
)

// Cached function to fetch event with albums and counts
export const getCachedEventData = unstable_cache(
  async (slug: string, hasAccess: boolean) => {
    // Get event details by slug
    const eventResult = await db
      .select({
        id: events.id,
        name: events.name,
        coupleNames: events.coupleNames,
        eventDate: events.eventDate,
        slug: events.slug,
        themeId: events.themeId,
        uploadWindowEnd: events.uploadWindowEnd,
        downloadWindowEnd: events.downloadWindowEnd,
        privacySettings: events.privacySettings,
        moderationSettings: events.moderationSettings,
        coverImageUrl: events.coverImageUrl,
        guestCanViewAlbum: events.guestCanViewAlbum,
        approveUploads: events.approveUploads,
        userId: events.userId,
        isPublished: events.isPublished,
        activationDate: events.activationDate,
      })
      .from(events)
      .where(eq(events.slug, slug))
      .limit(1)

    if (!eventResult.length) {
      return null
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

    // Get uploads count
    const uploadsCount = await db
      .select({ count: count() })
      .from(uploads)
      .where(
        hasAccess 
          ? eq(uploads.eventId, event.id)
          : and(eq(uploads.eventId, event.id), eq(uploads.isApproved, true))
      )

    // Get approved uploads count
    const approvedUploadsCount = await db
      .select({ count: count() })
      .from(uploads)
      .where(and(eq(uploads.eventId, event.id), eq(uploads.isApproved, true)))

    // Get approved guestbook entries count
    const guestbookCountResult = await db
      .select({ count: count() })
      .from(guestbookEntries)
      .where(and(
        eq(guestbookEntries.eventId, event.id),
        eq(guestbookEntries.isApproved, true)
      ))

    return {
      ...event,
      albums: albumsResult,
      uploadsCount: uploadsCount[0]?.count || 0,
      approvedUploadsCount: approvedUploadsCount[0]?.count || 0,
      guestbookCount: guestbookCountResult[0]?.count || 0,
    }
  },
  ['event-data'],
  {
    tags: ['gallery', 'event'],
    revalidate: 60, // Cache for 60 seconds as fallback
  }
)