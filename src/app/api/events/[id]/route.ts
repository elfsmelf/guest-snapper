import { db } from "@/database/db"
import { events } from "@/database/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { validateEventAccess } from "@/lib/auth-helpers"
import { NextRequest } from "next/server"
import { revalidatePath } from "next/cache"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify the user can access this event (owner or organization member)
    try {
      const result = await validateEventAccess(id, session.user.id)
      const event = result.event
      
      return Response.json(event)
    } catch (error) {
      return Response.json({ error: "Event not found" }, { status: 404 })
    }

  } catch (error) {
    console.error('Failed to fetch event:', error)
    return Response.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Verify the user can access this event (owner only for editing basic info)
    try {
      const result = await validateEventAccess(id, session.user.id)

      // Only event owners can edit basic event information
      if (result.event.userId !== session.user.id) {
        return Response.json({ error: "Only event owners can edit event details" }, { status: 403 })
      }
    } catch (error) {
      return Response.json({ error: "Event not found" }, { status: 404 })
    }

    // Extract allowed fields for update
    const allowedFields = ['name', 'venue', 'eventType', 'eventDate']
    const updateData: any = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // If eventDate is provided, ensure it's properly formatted
    if (updateData.eventDate) {
      updateData.eventDate = new Date(updateData.eventDate).toISOString()
    }

    // Add updatedAt timestamp
    updateData.updatedAt = new Date().toISOString()

    // Update the event
    const [updatedEvent] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning()

    if (!updatedEvent) {
      return Response.json({ error: "Failed to update event" }, { status: 500 })
    }

    // Revalidate the event detail page and dashboard to show updated data
    revalidatePath(`/dashboard/events/${id}`)
    revalidatePath('/dashboard')
    // Also revalidate the gallery page if slug changed
    if (updatedEvent.slug) {
      revalidatePath(`/gallery/${updatedEvent.slug}`)
    }

    return Response.json(updatedEvent)

  } catch (error) {
    console.error('Failed to update event:', error)
    return Response.json(
      { error: "Failed to update event" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if user is admin
    const isAdmin = (session.user as any).role === 'admin'

    if (!isAdmin) {
      // Non-admin users can only trash their own events
      try {
        const result = await validateEventAccess(id, session.user.id)
        if (result.event.userId !== session.user.id) {
          return Response.json({ error: "Only event owners can delete events" }, { status: 403 })
        }
      } catch (error) {
        return Response.json({ error: "Event not found" }, { status: 404 })
      }
    }

    // Get event details
    const eventResult = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1)

    if (!eventResult.length) {
      return Response.json({ error: "Event not found" }, { status: 404 })
    }

    const event = eventResult[0]

    // Delete all files from R2 for this event
    try {
      const { r2Client, bucketName } = await import('@/lib/r2/client')
      const { ListObjectsV2Command, DeleteObjectsCommand } = await import('@aws-sdk/client-s3')

      // List all objects in the event folder
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: `events/${id}/`
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

        console.log(`Deleted ${deleteObjects.length} files from R2 for event ${id}`)
      }
    } catch (r2Error) {
      console.error('R2 deletion error:', r2Error)
      // Continue with database update even if R2 deletion fails
    }

    // Update event status to deleted
    const [updatedEvent] = await db
      .update(events)
      .set({
        status: 'deleted',
        updatedAt: new Date().toISOString()
      })
      .where(eq(events.id, id))
      .returning()

    if (!updatedEvent) {
      return Response.json({ error: "Failed to delete event" }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: "Event deleted and files removed from R2",
      event: updatedEvent
    })

  } catch (error) {
    console.error('Failed to delete event:', error)
    return Response.json(
      { error: "Failed to delete event" },
      { status: 500 }
    )
  }
}