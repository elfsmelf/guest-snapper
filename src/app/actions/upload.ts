'use server'

import { db } from '@/database/db'
import { uploads, events, guests } from '@/database/schema'
import { eq, count, countDistinct, and, isNotNull } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
import { revalidateTag } from 'next/cache'
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

    // Handle anonymous guest tracking for non-authenticated users
    if (!session?.user?.id) {
      guestId = cookieStore.get('guest_id')?.value || null
      
      if (guestId) {
        // Check if guest record already exists for this event
        const existingGuest = await db
          .select()
          .from(guests)
          .where(and(
            eq(guests.id, guestId),
            eq(guests.eventId, uploadData.eventId)
          ))
          .limit(1)

        if (existingGuest.length > 0) {
          anonId = existingGuest[0].id
        } else {
          // Create new guest record for this event
          const newGuest = await db
            .insert(guests)
            .values({
              id: guestId,
              eventId: uploadData.eventId,
              guestName: uploadData.uploaderName || null,
              ipAddress: null, // Could add IP tracking if needed
              userAgent: null, // Could add user agent tracking if needed
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning()
          
          anonId = newGuest[0].id
        }
      }
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

    // Invalidate cache tags to refresh gallery data
    revalidateTag('gallery')
    revalidateTag('event')
    
    console.log('Upload created and cache invalidated:', newUpload[0].id)

    return {
      success: true,
      upload: newUpload[0]
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

    // Invalidate cache tags
    revalidateTag('gallery')
    revalidateTag('event')
    
    console.log('Upload approved and cache invalidated:', uploadId)

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

    // Delete the upload
    const deletedUpload = await db
      .delete(uploads)
      .where(eq(uploads.id, uploadId))
      .returning()

    if (!deletedUpload.length) {
      throw new Error('Upload not found')
    }

    // Invalidate cache tags
    revalidateTag('gallery')
    revalidateTag('event')
    
    console.log('Upload rejected and cache invalidated:', uploadId)

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