"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/database/db"
import { events, uploads } from "@/database/schema"
import { eq } from "drizzle-orm"
import { canUserAccessEvent } from "@/lib/auth-helpers"
import { r2Client, bucketName } from "@/lib/r2/client"
import { ListObjectsV2Command, DeleteObjectsCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { redirect } from "next/navigation"

export async function deleteEvent(eventId: string) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    // Check if user has access to this event (must be owner or org member)
    const hasAccess = await canUserAccessEvent(eventId, session.user.id)
    if (!hasAccess) {
      return { success: false, error: "Access denied" }
    }

    // Get event details to verify ownership
    const eventResult = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!eventResult.length) {
      return { success: false, error: "Event not found" }
    }

    const event = eventResult[0]

    // Only allow event owner or org admin to delete
    const isOwner = session.user.id === event.userId
    if (!isOwner) {
      // TODO: Add organization admin check when needed
      return { success: false, error: "Only the event owner can delete this event" }
    }

    // Step 1: Get all uploads to delete from R2
    const uploadsToDelete = await db
      .select({ fileUrl: uploads.fileUrl })
      .from(uploads)
      .where(eq(uploads.eventId, eventId))

    // Step 2: Delete all files from R2
    if (uploadsToDelete.length > 0) {
      try {
        // First, try to list all objects in the event folder
        const listCommand = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: `events/${eventId}/`
        })

        const listResult = await r2Client.send(listCommand)
        
        if (listResult.Contents && listResult.Contents.length > 0) {
          // Batch delete objects (R2 supports up to 1000 objects per request)
          const deleteObjects = listResult.Contents.map(obj => ({ Key: obj.Key! }))
          
          // Split into chunks of 1000 if necessary
          const chunks = []
          for (let i = 0; i < deleteObjects.length; i += 1000) {
            chunks.push(deleteObjects.slice(i, i + 1000))
          }

          // Delete all chunks
          for (const chunk of chunks) {
            const deleteCommand = new DeleteObjectsCommand({
              Bucket: bucketName,
              Delete: {
                Objects: chunk,
                Quiet: true
              }
            })
            await r2Client.send(deleteCommand)
          }
        }

        // Also delete individual files by their URLs (as fallback)
        for (const upload of uploadsToDelete) {
          try {
            // Extract key from fileUrl
            const url = new URL(upload.fileUrl)
            const key = url.pathname.substring(1) // Remove leading slash
            
            const deleteCommand = new DeleteObjectCommand({
              Bucket: bucketName,
              Key: key
            })
            await r2Client.send(deleteCommand)
          } catch (fileError) {
            console.error(`Failed to delete file ${upload.fileUrl}:`, fileError)
            // Continue with other files
          }
        }
      } catch (r2Error) {
        console.error('R2 deletion error:', r2Error)
        return { success: false, error: "Failed to delete files from storage" }
      }
    }

    // Step 3: Update event status to deleted instead of permanently deleting
    // This preserves the event record for analytics while marking it as deleted
    try {
      await db
        .update(events)
        .set({
          status: 'deleted',
          updatedAt: new Date().toISOString()
        })
        .where(eq(events.id, eventId))
    } catch (dbError) {
      console.error('Database update error:', dbError)
      return { success: false, error: "Failed to update event status" }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting event:', error)
    return { success: false, error: "Failed to delete event" }
  }
}

