import { cache } from 'react'
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

// React cache for request memoization (deduplicates within same request)
const getGalleryDataInternal = cache(async (eventId: string, hasAccess: boolean) => {
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
})

// Direct function to fetch gallery data (uses React cache for request deduplication)
export const getCachedGalleryData = async (eventId: string, hasAccess: boolean) => {
  // SSR: All users get fresh data on each page load
  // React cache() handles request-level deduplication within the same request
  
  return getGalleryDataInternal(eventId, hasAccess)
}

// React cache for request memoization
const getEventDataInternal = cache(async (slug: string) => {
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
    approvedUploadsCount: uploadsCount,
    guestbookCount: guestbookCount,
  }
})

// Direct function to fetch event data (uses React cache for request deduplication) 
export const getCachedEventData = async (slug: string, hasAccess: boolean) => {
  // SSR: All users get fresh data on each page load
  // React cache() handles request-level deduplication within the same request
  
  return getEventDataInternal(slug)
}

// Explicitly non-cached function (opts out of all caching)
export const getFreshEventData = async (slug: string) => {
  unstable_noStore() // Opt out of even request memoization
  
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
    approvedUploadsCount: uploadsCount,
    guestbookCount: guestbookCount,
  }
}