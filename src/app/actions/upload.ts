'use server'

import { db } from '@/database/db'
import { uploads, events } from '@/database/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidateTag } from 'next/cache'

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

    // Ensure we have a session for tracking
    if (!session?.user?.id) {
      throw new Error('No user session found')
    }

    // Verify event exists
    const eventResult = await db
      .select()
      .from(events)
      .where(eq(events.id, uploadData.eventId))
      .limit(1)

    if (!eventResult.length) {
      throw new Error('Event not found')
    }

    // Determine moderation status based on event settings
    const moderationStatus = !eventResult[0].approveUploads

    // Insert upload record
    const newUpload = await db
      .insert(uploads)
      .values({
        eventId: uploadData.eventId,
        albumId: uploadData.albumId || null,
        sessionId: session.user.id,
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