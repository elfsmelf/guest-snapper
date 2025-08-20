import { db } from "@/database/db"
import { events, uploads, albums, guestbookEntries, deletionEvents } from "@/database/schema"
import { eq, and, lt, isNotNull, or } from "drizzle-orm"
import { r2Client, bucketName } from "@/lib/r2/client"
import { ListObjectsV2Command, DeleteObjectsCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { addDays } from "date-fns"

export interface DeletionResult {
  success: boolean
  eventsProcessed: number
  errors: string[]
}

export interface EventStatusTransition {
  eventId: string
  fromStatus: string
  toStatus: string
  reason: string
}

export async function moveExpiredEventsToTrash(): Promise<DeletionResult> {
  const results: DeletionResult = {
    success: true,
    eventsProcessed: 0,
    errors: []
  }

  try {
    const now = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(now.getFullYear() - 1)
    
    // Find active events that should be trashed:
    // 1. Published events past their download window, OR
    // 2. Free events created more than 1 year ago
    const expiredEvents = await db
      .select({
        id: events.id,
        name: events.name,
        downloadWindowEnd: events.downloadWindowEnd,
        status: events.status,
        plan: events.plan,
        createdAt: events.createdAt,
        isPublished: events.isPublished
      })
      .from(events)
      .where(
        and(
          eq(events.status, 'active'),
          or(
            // Published events past their download window
            and(
              eq(events.isPublished, true),
              lt(events.downloadWindowEnd, now.toISOString())
            ),
            // Free events older than 1 year (regardless of published status)
            and(
              eq(events.plan, 'free'),
              lt(events.createdAt, oneYearAgo.toISOString())
            )
          )
        )
      )

    if (expiredEvents.length === 0) {
      return results
    }

    // Process each expired event
    for (const event of expiredEvents) {
      try {
        const deleteAt = addDays(now, 30) // 30 days from now for permanent deletion
        
        // Determine the reason for trashing
        const downloadExpired = event.isPublished && new Date(event.downloadWindowEnd) < now
        const freeEventOldEnough = event.plan === 'free' && new Date(event.createdAt) < oneYearAgo
        
        let reason = 'unknown'
        let reasonDescription = ''
        
        if (downloadExpired && freeEventOldEnough) {
          reason = 'expired_download_and_free_old'
          reasonDescription = 'Download window expired AND free event over 1 year old'
        } else if (downloadExpired) {
          reason = 'expired_download'
          reasonDescription = 'Download window expired'
        } else if (freeEventOldEnough) {
          reason = 'free_event_old'
          reasonDescription = 'Free event over 1 year old'
        }
        
        // Update event status to trashed
        await db.transaction(async (tx) => {
          // Update event status
          await tx
            .update(events)
            .set({
              status: 'trashed',
              trashedAt: now.toISOString(),
              deleteAt: deleteAt.toISOString(),
              updatedAt: now.toISOString()
            })
            .where(eq(events.id, event.id))

          // Log the deletion event
          await tx.insert(deletionEvents).values({
            eventId: event.id,
            action: 'trashed',
            reason: reason,
            executedAt: now.toISOString(),
            metadata: JSON.stringify({
              eventName: event.name,
              plan: event.plan,
              downloadWindowEnd: event.downloadWindowEnd,
              createdAt: event.createdAt,
              scheduledDeletion: deleteAt.toISOString(),
              reasonDescription: reasonDescription
            })
          })
        })

        results.eventsProcessed++
        
      } catch (error) {
        const errorMsg = `Failed to trash event ${event.id}: ${error}`
        results.errors.push(errorMsg)
        console.error(errorMsg)
        results.success = false
      }
    }

  } catch (error) {
    const errorMsg = `Failed to process expired events: ${error}`
    results.errors.push(errorMsg)
    console.error(errorMsg)
    results.success = false
  }

  return results
}

export async function permanentlyDeleteTrashedEvents(): Promise<DeletionResult> {
  const results: DeletionResult = {
    success: true,
    eventsProcessed: 0,
    errors: []
  }

  try {
    const now = new Date()
    
    // Find trashed events ready for permanent deletion
    const eventsToDelete = await db
      .select({
        id: events.id,
        name: events.name,
        deleteAt: events.deleteAt,
        status: events.status
      })
      .from(events)
      .where(
        and(
          eq(events.status, 'trashed'),
          isNotNull(events.deleteAt),
          lt(events.deleteAt, now.toISOString())
        )
      )

    if (eventsToDelete.length === 0) {
      return results
    }

    // Process each event for permanent deletion
    for (const event of eventsToDelete) {
      try {
        await permanentlyDeleteEvent(event.id, event.name)
        results.eventsProcessed++
        
      } catch (error) {
        const errorMsg = `Failed to permanently delete event ${event.id}: ${error}`
        results.errors.push(errorMsg)
        console.error(errorMsg)
        results.success = false
      }
    }

  } catch (error) {
    const errorMsg = `Failed to process trashed events: ${error}`
    results.errors.push(errorMsg)
    console.error(errorMsg)
    results.success = false
  }

  return results
}

async function permanentlyDeleteEvent(eventId: string, eventName: string): Promise<void> {
  // Step 1: Delete all files from R2 storage
  await deleteEventFilesFromR2(eventId)

  // Step 2: Delete from database with proper transaction
  await db.transaction(async (tx) => {
    // Log the final deletion event before removing the event
    await tx.insert(deletionEvents).values({
      eventId: eventId,
      action: 'deleted',
      reason: 'scheduled_cleanup',
      executedAt: new Date().toISOString(),
      metadata: JSON.stringify({
        eventName: eventName,
        deletionMethod: 'scheduled'
      })
    })

    // Delete in proper order to respect foreign key constraints
    await tx.delete(guestbookEntries).where(eq(guestbookEntries.eventId, eventId))
    await tx.delete(uploads).where(eq(uploads.eventId, eventId))
    await tx.delete(albums).where(eq(albums.eventId, eventId))
    await tx.delete(events).where(eq(events.id, eventId))
  })
}

async function deleteEventFilesFromR2(eventId: string): Promise<void> {
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

    // Also get individual file URLs from database and delete them as fallback
    const uploadsToDelete = await db
      .select({ fileUrl: uploads.fileUrl })
      .from(uploads)
      .where(eq(uploads.eventId, eventId))

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
    throw new Error(`Failed to delete files from storage: ${r2Error}`)
  }
}


export async function restoreEventFromTrash(eventId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the event exists and is trashed
    const eventResult = await db
      .select({
        id: events.id,
        name: events.name,
        status: events.status,
        userId: events.userId,
        organizationId: events.organizationId
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!eventResult.length) {
      return { success: false, error: "Event not found" }
    }

    const event = eventResult[0]

    if (event.status !== 'trashed') {
      return { success: false, error: "Event is not in trash" }
    }

    // Check if user has permission to restore (owner or org member)
    if (event.userId !== userId) {
      // TODO: Add organization member check when needed
      return { success: false, error: "Access denied" }
    }

    // Restore the event
    await db.transaction(async (tx) => {
      // Update event status back to active
      await tx
        .update(events)
        .set({
          status: 'active',
          trashedAt: null,
          deleteAt: null,
          updatedAt: new Date().toISOString()
        })
        .where(eq(events.id, eventId))

      // Log the restoration
      await tx.insert(deletionEvents).values({
        eventId: eventId,
        action: 'restored',
        reason: 'manual',
        executedAt: new Date().toISOString(),
        metadata: JSON.stringify({
          eventName: event.name,
          restoredBy: userId
        })
      })
    })

    return { success: true }
    
  } catch (error) {
    console.error('Error restoring event:', error)
    return { success: false, error: "Failed to restore event" }
  }
}


export async function getScheduledDeletionStatus() {
  try {
    const now = new Date()
    
    // Count events by status
    const [activeEvents, trashedEvents, eventsToDelete] = await Promise.all([
      db.select({ count: events.id }).from(events).where(eq(events.status, 'active')),
      db.select({ count: events.id }).from(events).where(eq(events.status, 'trashed')),
      db.select({ count: events.id }).from(events).where(
        and(
          eq(events.status, 'trashed'),
          isNotNull(events.deleteAt),
          lt(events.deleteAt, now.toISOString())
        )
      )
    ])

    // Count events due for trashing
    const eventsDueForTrash = await db
      .select({ count: events.id })
      .from(events)
      .where(
        and(
          eq(events.status, 'active'),
          lt(events.downloadWindowEnd, now.toISOString()),
          eq(events.isPublished, true)
        )
      )

    return {
      activeEvents: activeEvents.length,
      trashedEvents: trashedEvents.length,
      eventsDueForTrash: eventsDueForTrash.length,
      eventsReadyForDeletion: eventsToDelete.length,
      lastChecked: now.toISOString()
    }
    
  } catch (error) {
    console.error('Error getting deletion status:', error)
    throw error
  }
}