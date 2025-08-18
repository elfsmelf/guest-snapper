import { db } from "@/database/db"
import { events } from "@/database/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { validateEventAccess } from "@/lib/auth-helpers"

export async function PATCH(
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
    const body = await request.json()

    // Verify the user can access this event (owner or organization member)
    let event
    try {
      const result = await validateEventAccess(id, session.user.id)
      event = result.event
    } catch (error) {
      return Response.json({ error: "Event not found" }, { status: 404 })
    }

    // Extract settings to update
    const {
      eventDate,
      activationDate,
      guestCanViewAlbum,
      approveUploads,
      guestCount,
      coverImageUrl,
      settings: additionalSettings = {}
    } = body

    // Get current settings
    const currentSettings = event.settings
      ? JSON.parse(event.settings)
      : {}

    // Merge settings
    const updatedSettings = {
      ...currentSettings,
      ...additionalSettings,
      lastUpdated: new Date().toISOString()
    }

    // Update the event
    const updateData: any = {
      settings: JSON.stringify(updatedSettings),
      updatedAt: new Date().toISOString()
    }

    // Update individual fields if provided
    if (eventDate) updateData.eventDate = eventDate
    if (activationDate !== undefined) updateData.activationDate = activationDate
    if (typeof guestCanViewAlbum === 'boolean') updateData.guestCanViewAlbum = guestCanViewAlbum
    if (typeof approveUploads === 'boolean') updateData.approveUploads = approveUploads
    if (typeof guestCount === 'number') updateData.guestCount = guestCount
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl

    const updatedEvent = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning()

    return Response.json({ 
      success: true, 
      event: updatedEvent[0] 
    })

  } catch (error) {
    console.error('Failed to update event settings:', error)
    return Response.json(
      { error: "Failed to update event settings" },
      { status: 500 }
    )
  }
}