import { db } from '@/database/db'
import { uploads, guests, guestbookEntries } from '@/database/schema'
import { eq, and } from 'drizzle-orm'

interface GuestContent {
  uploads: any[]
  guestbookEntries: any[]
  totalCount: number
}

/**
 * Get all content (uploads + guestbook entries) for a specific guest in an event
 */
export async function getGuestOwnContent(guestCookieId: string, eventId: string): Promise<GuestContent> {
  console.log('🔍 Getting guest content for cookieId:', guestCookieId, 'eventId:', eventId)
  
  // Find the guest record for this cookie + event combination
  const guestRecord = await db
    .select()
    .from(guests)
    .where(and(
      eq(guests.cookieId, guestCookieId),
      eq(guests.eventId, eventId)
    ))
    .limit(1)

  console.log('🔍 Found guest records:', guestRecord.length)

  if (!guestRecord.length) {
    // No guest record exists yet - return empty content
    console.log('🔍 No guest record found - returning empty content')
    return {
      uploads: [],
      guestbookEntries: [],
      totalCount: 0
    }
  }

  const guestId = guestRecord[0].id
  console.log('🔍 Using guest ID:', guestId)

  // Get all uploads by this guest (approved and pending)
  const guestUploads = await db
    .select({
      id: uploads.id,
      eventId: uploads.eventId,
      albumId: uploads.albumId,
      fileName: uploads.fileName,
      fileUrl: uploads.fileUrl,
      fileType: uploads.fileType,
      mimeType: uploads.mimeType,
      fileSize: uploads.fileSize,
      caption: uploads.caption,
      isApproved: uploads.isApproved,
      uploaderName: uploads.uploaderName,
      createdAt: uploads.createdAt,
      updatedAt: uploads.updatedAt,
    })
    .from(uploads)
    .where(eq(uploads.anonId, guestId))
    .orderBy(uploads.createdAt)

  console.log('🔍 Found uploads:', guestUploads.length)

  // Get all guestbook entries by this guest
  const guestMessages = await db
    .select({
      id: guestbookEntries.id,
      eventId: guestbookEntries.eventId,
      guestName: guestbookEntries.guestName,
      message: guestbookEntries.message,
      isApproved: guestbookEntries.isApproved,
      createdAt: guestbookEntries.createdAt,
    })
    .from(guestbookEntries)
    .where(eq(guestbookEntries.anonId, guestId))
    .orderBy(guestbookEntries.createdAt)

  console.log('🔍 Found messages:', guestMessages.length)
  console.log('🔍 Total content:', guestUploads.length + guestMessages.length)

  return {
    uploads: guestUploads,
    guestbookEntries: guestMessages,
    totalCount: guestUploads.length + guestMessages.length
  }
}