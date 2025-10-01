import { db } from "@/database/db"
import { events, uploads, albums, guestbookEntries } from "@/database/schema"
import { organizations, members, users } from "@/../auth-schema"
import { eq, and, desc, count, inArray } from "drizzle-orm"
import { placeholder } from "drizzle-orm"

/**
 * Prepared statements for frequently used queries
 * These provide massive performance benefits by pre-compiling SQL
 */

// Event queries (most frequently accessed)
export const getEventBySlug = db
  .select({
    id: events.id,
    name: events.name,
    slug: events.slug,
    userId: events.userId,
    organizationId: events.organizationId,
    isPublished: events.isPublished,
    guestCanViewAlbum: events.guestCanViewAlbum,
    guestCanViewGuestbook: events.guestCanViewGuestbook,
    guestCanViewAudioMessages: events.guestCanViewAudioMessages,
    approveUploads: events.approveUploads,
    coverImageUrl: events.coverImageUrl,
    themeId: events.themeId,
    quickStartProgress: events.quickStartProgress,
    coupleNames: events.coupleNames,
    eventDate: events.eventDate,
    activationDate: events.activationDate,
    privacySettings: events.privacySettings,
    eventType: events.eventType,
    status: events.status
  })
  .from(events)
  .where(and(
    eq(events.slug, placeholder("slug")),
    eq(events.status, "active")
  ))
  .prepare("getEventBySlug")

export const getEventById = db
  .select({
    id: events.id,
    name: events.name,
    slug: events.slug,
    userId: events.userId,
    organizationId: events.organizationId,
    isPublished: events.isPublished,
    guestCanViewAlbum: events.guestCanViewAlbum,
    guestCanViewGuestbook: events.guestCanViewGuestbook,
    guestCanViewAudioMessages: events.guestCanViewAudioMessages,
    approveUploads: events.approveUploads,
    coverImageUrl: events.coverImageUrl,
    themeId: events.themeId,
    quickStartProgress: events.quickStartProgress,
    coupleNames: events.coupleNames,
    eventDate: events.eventDate,
    activationDate: events.activationDate,
    privacySettings: events.privacySettings,
    eventType: events.eventType,
    status: events.status
  })
  .from(events)
  .where(and(
    eq(events.id, placeholder("eventId")),
    eq(events.status, "active")
  ))
  .prepare("getEventById")

// Upload queries (frequently accessed in galleries)
export const getUploadsByEventId = db
  .select({
    id: uploads.id,
    eventId: uploads.eventId,
    fileName: uploads.fileName,
    fileUrl: uploads.fileUrl,
    fileType: uploads.fileType,
    uploaderName: uploads.uploaderName,
    caption: uploads.caption,
    createdAt: uploads.createdAt,
    isApproved: uploads.isApproved,
    albumId: uploads.albumId
  })
  .from(uploads)
  .where(and(
    eq(uploads.eventId, placeholder("eventId")),
    eq(uploads.isApproved, true)
  ))
  .orderBy(desc(uploads.createdAt))
  .prepare("getUploadsByEventId")

// Get all uploads for access-enabled users (including pending)
export const getAllUploadsByEventId = db
  .select({
    id: uploads.id,
    eventId: uploads.eventId,
    fileName: uploads.fileName,
    fileUrl: uploads.fileUrl,
    fileType: uploads.fileType,
    uploaderName: uploads.uploaderName,
    caption: uploads.caption,
    createdAt: uploads.createdAt,
    isApproved: uploads.isApproved,
    albumId: uploads.albumId
  })
  .from(uploads)
  .where(eq(uploads.eventId, placeholder("eventId")))
  .orderBy(desc(uploads.createdAt))
  .prepare("getAllUploadsByEventId")

export const getUploadCountByEventId = db
  .select({ count: count() })
  .from(uploads)
  .where(and(
    eq(uploads.eventId, placeholder("eventId")),
    eq(uploads.isApproved, true)
  ))
  .prepare("getUploadCountByEventId")

// Get guestbook count for events
export const getGuestbookCountByEventId = db
  .select({ count: count() })
  .from(guestbookEntries)
  .where(and(
    eq(guestbookEntries.eventId, placeholder("eventId")),
    eq(guestbookEntries.isApproved, true)
  ))
  .prepare("getGuestbookCountByEventId")

// Get albums by event ID
export const getAlbumsByEventId = db
  .select({
    id: albums.id,
    name: albums.name,
    sortOrder: albums.sortOrder,
    isVisible: albums.isVisible,
    isFavorite: albums.isFavorite
  })
  .from(albums)
  .where(eq(albums.eventId, placeholder("eventId")))
  .orderBy(albums.sortOrder)
  .prepare("getAlbumsByEventId")

// Organization membership queries (for access control)
export const getUserOrganizationIds = db
  .select({ organizationId: members.organizationId })
  .from(members)
  .where(eq(members.userId, placeholder("userId")))
  .prepare("getUserOrganizationIds")

export const getEventsByOrganizationIds = db
  .select({
    id: events.id,
    name: events.name,
    slug: events.slug,
    userId: events.userId,
    isPublished: events.isPublished,
    guestCanViewAlbum: events.guestCanViewAlbum
  })
  .from(events)
  .where(inArray(events.organizationId, placeholder("organizationIds")))
  .prepare("getEventsByOrganizationIds")

/**
 * Optimized query functions using prepared statements
 */

export async function getOptimizedEventBySlug(slug: string) {
  const result = await getEventBySlug.execute({ slug })
  return result[0] || null
}

export async function getOptimizedEventById(eventId: string) {
  const result = await getEventById.execute({ eventId })
  return result[0] || null
}

export async function getOptimizedUploadsByEventId(eventId: string, hasAccess: boolean = false) {
  if (hasAccess) {
    return await getAllUploadsByEventId.execute({ eventId })
  } else {
    return await getUploadsByEventId.execute({ eventId })
  }
}

export async function getOptimizedUploadCountByEventId(eventId: string) {
  try {
    const result = await getUploadCountByEventId.execute({ eventId })
    return result[0]?.count || 0
  } catch (error) {
    console.error('Error getting upload count:', error)
    console.error('Event ID:', eventId)
    // Return 0 for now to prevent the page from crashing
    return 0
  }
}

export async function getOptimizedAlbumsByEventId(eventId: string) {
  return await getAlbumsByEventId.execute({ eventId })
}

export async function getOptimizedGuestbookCountByEventId(eventId: string) {
  const result = await getGuestbookCountByEventId.execute({ eventId })
  return result[0]?.count || 0
}

export async function checkUserEventAccess(eventId: string, userId: string) {
  // First check if user owns the event
  const event = await getOptimizedEventById(eventId)
  if (event?.userId === userId) {
    return true
  }

  // Then check organization membership
  const userOrgs = await getUserOrganizationIds.execute({ userId })
  if (userOrgs.length === 0) {
    return false
  }

  const orgIds = userOrgs.map(org => org.organizationId).filter(Boolean) as string[]
  if (orgIds.length === 0) {
    return false
  }

  const orgEvents = await getEventsByOrganizationIds.execute({ organizationIds: orgIds })
  return orgEvents.some(e => e.id === eventId)
}

/**
 * Batch operations for improved performance
 * Use when you need to perform multiple related operations
 */

export async function batchUpdateUploadsApproval(
  uploadIds: string[], 
  isApproved: boolean
) {
  // Using batch API for multiple updates
  const updatePromises = uploadIds.map(id => 
    db.update(uploads)
      .set({ isApproved })
      .where(eq(uploads.id, id))
  )

  // Execute all updates in parallel for better performance
  return await Promise.all(updatePromises)
}

/**
 * Cache-friendly query patterns
 * These are optimized for React Query caching
 */

export const galleryQueryKeys = {
  all: ['gallery'] as const,
  events: () => [...galleryQueryKeys.all, 'events'] as const,
  event: (slug: string) => [...galleryQueryKeys.events(), slug] as const,
  eventUploads: (eventId: string) => [...galleryQueryKeys.all, 'uploads', eventId] as const,
  eventUploadCount: (eventId: string) => [...galleryQueryKeys.all, 'upload-count', eventId] as const,
}

// Helper function to create React Query compatible functions
export const createOptimizedQueries = {
  getEvent: (slug: string) => ({
    queryKey: galleryQueryKeys.event(slug),
    queryFn: () => getOptimizedEventBySlug(slug),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  }),

  getUploads: (eventId: string) => ({
    queryKey: galleryQueryKeys.eventUploads(eventId),
    queryFn: () => getOptimizedUploadsByEventId(eventId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  }),

  getUploadCount: (eventId: string) => ({
    queryKey: galleryQueryKeys.eventUploadCount(eventId),
    queryFn: () => getOptimizedUploadCountByEventId(eventId),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  })
}