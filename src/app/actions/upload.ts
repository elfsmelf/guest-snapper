'use server'

import { db } from '@/database/db'
import { uploads, events, guests, albums } from '@/database/schema'
import { eq, count, countDistinct, and, isNotNull, inArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
import { canAcceptMoreGuests } from '@/lib/feature-gates'

interface UploadData {
  eventId: string
  albumId?: string
  uploaderName?: string
  caption?: string
  fileName: string
  fileSize: number
  fileType: 'image' | 'video' | 'audio'
  fileUrl: string
  mimeType: string
}

export async function createUpload(uploadData: UploadData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    const cookieStore = await cookies()
    let guestId: string | null = null
    let anonId: string | null = null

    // Handle guest tracking for anonymous users
    guestId = cookieStore.get('guest_id')?.value || null

    if (guestId) {
      console.log('🔍 Upload with guest ID:', guestId, 'authenticated:', !!session?.user?.id)

      // PostgreSQL UPSERT using composite unique constraint (cookieId + eventId)
      const guestResult = await db
        .insert(guests)
        .values({
          cookieId: guestId, // Browser cookie ID
          eventId: uploadData.eventId,
          guestName: uploadData.uploaderName || null,
          ipAddress: null, // Could add IP tracking if needed
          userAgent: null, // Could add user agent tracking if needed
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing({ target: [guests.cookieId, guests.eventId] })
        .returning()

      // If insert succeeded, use the new record; otherwise fetch existing
      if (guestResult.length > 0) {
        anonId = guestResult[0].id
        console.log('🔍 Created new guest record:', anonId)
      } else {
        // Fetch the existing record (created by concurrent request)
        const existingGuest = await db
          .select()
          .from(guests)
          .where(and(
            eq(guests.cookieId, guestId),
            eq(guests.eventId, uploadData.eventId)
          ))
          .limit(1)
        
        if (existingGuest.length > 0) {
          anonId = existingGuest[0].id
          console.log('🔍 Using existing guest record:', anonId)
        } else {
          throw new Error('Failed to create or find guest record')
        }
      }
    } else if (!session?.user?.id) {
      console.log('🔍 Anonymous user upload without guest ID')
    }

    // Verify event exists and get event details for plan checking
    const eventResult = await db
      .select()
      .from(events)
      .where(eq(events.id, uploadData.eventId))
      .limit(1)

    if (!eventResult.length) {
      throw new Error('Event not found')
    }

    const event = eventResult[0]

    // Get current unique guest count (authenticated users + anonymous guests)
    const authenticatedGuestCount = await db
      .select({ count: countDistinct(uploads.sessionId) })
      .from(uploads)
      .where(and(
        eq(uploads.eventId, uploadData.eventId),
        isNotNull(uploads.sessionId)
      ))

    const anonymousGuestCount = await db
      .select({ count: countDistinct(uploads.anonId) })
      .from(uploads)
      .where(and(
        eq(uploads.eventId, uploadData.eventId),
        isNotNull(uploads.anonId)
      ))

    const currentGuestCount = (authenticatedGuestCount[0]?.count || 0) + (anonymousGuestCount[0]?.count || 0)

    // Check if this is a new guest
    let isNewGuest = true
    if (session?.user?.id) {
      // Check authenticated user uploads
      const existingUploadsForSession = await db
        .select({ count: count() })
        .from(uploads)
        .where(and(
          eq(uploads.eventId, uploadData.eventId),
          eq(uploads.sessionId, session.user.id)
        ))
      
      isNewGuest = (existingUploadsForSession[0]?.count || 0) === 0
    } else if (anonId) {
      // Check anonymous guest uploads
      const existingUploadsForGuest = await db
        .select({ count: count() })
        .from(uploads)
        .where(and(
          eq(uploads.eventId, uploadData.eventId),
          eq(uploads.anonId, anonId)
        ))
      
      isNewGuest = (existingUploadsForGuest[0]?.count || 0) === 0
    }

    const effectiveGuestCount = isNewGuest ? currentGuestCount + 1 : currentGuestCount

    // Check if event can accept more guests based on plan
    if (isNewGuest) {
      const guestCheck = canAcceptMoreGuests({
        id: event.id,
        plan: event.plan,
        guestCount: event.guestCount || 0,
        isPublished: event.isPublished
      }, effectiveGuestCount)

      if (!guestCheck.allowed && guestCheck.upgradeRequired) {
        throw new Error(`Guest limit exceeded. ${guestCheck.reason} Upgrade your plan to accept more guests.`)
      }
    }

    // Determine moderation status based on event settings
    const moderationStatus = !event.approveUploads
    
    console.log('Event approval settings:', { 
      eventId: event.id, 
      approveUploads: event.approveUploads, 
      moderationStatus: moderationStatus 
    })

    // Insert upload record
    const newUpload = await db
      .insert(uploads)
      .values({
        eventId: uploadData.eventId,
        albumId: uploadData.albumId || null,
        sessionId: session?.user?.id || null,
        anonId: anonId,
        fileName: uploadData.fileName,
        fileUrl: uploadData.fileUrl,
        fileType: uploadData.fileType,
        mimeType: uploadData.mimeType,
        fileSize: uploadData.fileSize,
        caption: uploadData.caption || null,
        isApproved: moderationStatus,
        uploaderName: uploadData.uploaderName || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    console.log('Upload created:', newUpload[0].id)

    return {
      success: true,
      upload: newUpload[0],
      eventSlug: event.slug
    }

  } catch (error) {
    console.error('Upload creation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

export async function approveUpload(uploadId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Get event information for path revalidation
    const upload = await db
      .select({ eventId: uploads.eventId })
      .from(uploads)
      .where(eq(uploads.id, uploadId))
      .limit(1)

    if (!upload.length) {
      throw new Error('Upload not found')
    }

    const event = await db
      .select({ slug: events.slug })
      .from(events)
      .where(eq(events.id, upload[0].eventId))
      .limit(1)

    // Update upload approval status
    const updatedUpload = await db
      .update(uploads)
      .set({
        isApproved: true,
        updatedAt: new Date(),
      })
      .where(eq(uploads.id, uploadId))
      .returning()

    if (!updatedUpload.length) {
      throw new Error('Upload not found')
    }

    console.log('Upload approved:', uploadId)

    return {
      success: true,
      upload: updatedUpload[0]
    }

  } catch (error) {
    console.error('Upload approval failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Approval failed'
    }
  }
}

export async function rejectUpload(uploadId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Get event information for path revalidation before deletion
    const upload = await db
      .select({ eventId: uploads.eventId })
      .from(uploads)
      .where(eq(uploads.id, uploadId))
      .limit(1)

    if (!upload.length) {
      throw new Error('Upload not found')
    }

    const event = await db
      .select({ slug: events.slug })
      .from(events)
      .where(eq(events.id, upload[0].eventId))
      .limit(1)

    // Delete the upload
    const deletedUpload = await db
      .delete(uploads)
      .where(eq(uploads.id, uploadId))
      .returning()

    if (!deletedUpload.length) {
      throw new Error('Upload not found')
    }

    console.log('Upload rejected:', uploadId)

    return {
      success: true,
      upload: deletedUpload[0]
    }

  } catch (error) {
    console.error('Upload rejection failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Rejection failed'
    }
  }
}

async function getOrCreateHiddenAlbum(eventId: string) {
  // First try to find existing Hidden album
  const existingHiddenAlbum = await db
    .select()
    .from(albums)
    .where(and(
      eq(albums.eventId, eventId),
      eq(albums.name, 'Hidden Images')
    ))
    .limit(1)

  if (existingHiddenAlbum.length > 0) {
    return existingHiddenAlbum[0]
  }

  // Create new Hidden album if it doesn't exist
  const newHiddenAlbum = await db
    .insert(albums)
    .values({
      eventId: eventId,
      name: 'Hidden Images',
      description: 'Images hidden from gallery visitors',
      isDefault: false,
      isVisible: false, // Only visible to owners/members
      sortOrder: 999, // Show last in album lists
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning()

  return newHiddenAlbum[0]
}

export async function bulkMoveToAlbum(uploadIds: string[], albumId: string | null) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    if (uploadIds.length === 0) {
      throw new Error('No uploads selected')
    }

    // Update all selected uploads using inArray
    const updatedUploads = await db
      .update(uploads)
      .set({
        albumId: albumId || null,
        updatedAt: new Date()
      })
      .where(inArray(uploads.id, uploadIds))
      .returning()

    console.log(`Moved ${uploadIds.length} uploads to album:`, albumId)

    return {
      success: true,
      count: updatedUploads.length,
      albumId: albumId,
      updatedUploads: updatedUploads
    }

  } catch (error) {
    console.error('Bulk move to album failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Move failed'
    }
  }
}

export async function bulkHideImages(uploadIds: string[]) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    if (uploadIds.length === 0) {
      throw new Error('No uploads selected')
    }

    // Get the event ID from the first upload to find/create Hidden album
    const firstUpload = await db
      .select({ eventId: uploads.eventId })
      .from(uploads)
      .where(eq(uploads.id, uploadIds[0]))
      .limit(1)

    if (!firstUpload.length) {
      throw new Error('Upload not found')
    }

    // Get or create the Hidden album
    const hiddenAlbum = await getOrCreateHiddenAlbum(firstUpload[0].eventId)

    // Move all selected uploads to Hidden album
    const updatedUploads = await db
      .update(uploads)
      .set({
        albumId: hiddenAlbum.id,
        updatedAt: new Date()
      })
      .where(inArray(uploads.id, uploadIds))
      .returning()

    console.log(`Moved ${uploadIds.length} uploads to Hidden album`)

    return {
      success: true,
      count: updatedUploads.length,
      message: `${updatedUploads.length} image(s) hidden successfully`
    }

  } catch (error) {
    console.error('Bulk hide images failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hide failed'
    }
  }
}

export async function hideImage(uploadId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Get the upload to find the event ID
    const upload = await db
      .select({ eventId: uploads.eventId })
      .from(uploads)
      .where(eq(uploads.id, uploadId))
      .limit(1)

    if (!upload.length) {
      throw new Error('Upload not found')
    }

    // Get or create the Hidden album
    const hiddenAlbum = await getOrCreateHiddenAlbum(upload[0].eventId)

    // Move upload to Hidden album
    const updatedUpload = await db
      .update(uploads)
      .set({
        albumId: hiddenAlbum.id,
        updatedAt: new Date()
      })
      .where(eq(uploads.id, uploadId))
      .returning()

    console.log(`Moved upload ${uploadId} to Hidden album`)

    return {
      success: true,
      message: 'Image hidden successfully'
    }

  } catch (error) {
    console.error('Hide image failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Hide failed'
    }
  }
}