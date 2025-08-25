import { unstable_cache } from 'next/cache'
import { db } from '@/database/db'
import { uploads, events, albums, guestbookEntries } from '@/database/schema'
import { eq, and, desc, count } from 'drizzle-orm'
import { 
  getOptimizedEventBySlug, 
  getOptimizedEventById, 
  getOptimizedUploadsByEventId,
  getOptimizedUploadCountByEventId,
  getOptimizedAlbumsByEventId,
  getOptimizedGuestbookCountByEventId
} from './drizzle-query-helpers'

interface GalleryData {
  uploads: any[]
  pendingUploads: any[]
  approvedCount: number
  pendingCount: number
  totalCount: number
  hasAccess: boolean
}

// Cached function to fetch gallery data using optimized prepared statements
export const getCachedGalleryData = unstable_cache(
  async (eventId: string, hasAccess: boolean) => {
    // Use optimized prepared statement for uploads
    const uploadsResult = await getOptimizedUploadsByEventId(eventId, hasAccess)

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

// Cached function to fetch event with albums and counts using optimized prepared statements
export const getCachedEventData = unstable_cache(
  async (slug: string, hasAccess: boolean) => {
    // Use optimized prepared statement for event lookup
    const event = await getOptimizedEventBySlug(slug)
    
    if (!event) {
      return null
    }

    // Use parallel queries with prepared statements for better performance
    const [albumsResult, uploadsCount, guestbookCount] = await Promise.all([
      getOptimizedAlbumsByEventId(event.id),
      getOptimizedUploadCountByEventId(event.id),
      getOptimizedGuestbookCountByEventId(event.id)
    ])

    return {
      ...event,
      albums: albumsResult,
      uploadsCount: uploadsCount,
      approvedUploadsCount: uploadsCount, // Using same count since we only query approved
      guestbookCount: guestbookCount,
    }
  },
  ['event-data'],
  {
    tags: ['gallery', 'event'],
    revalidate: 60, // Cache for 60 seconds as fallback
  }
)