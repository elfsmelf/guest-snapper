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
      themeId,
      isPublished,
      publishedAt,
      privacySettings,
      settings: additionalSettings = {}
    } = body

    // Check if trying to publish with free trial
    if (isPublished === true && (event.plan === 'free_trial' || event.plan === 'free' || !event.plan)) {
      return Response.json({
        error: "A paid plan is required to publish your gallery"
      }, { status: 400 })
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📝 Settings update request for event ${id}:`, {
        guestCanViewAlbum,
        currentValue: event.guestCanViewAlbum
      })
    }

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
    if (typeof guestCanViewAlbum === 'boolean') {
      updateData.guestCanViewAlbum = guestCanViewAlbum
      
      // ALSO update the privacySettings JSON to keep them in sync
      const currentPrivacySettings = event.privacySettings ? JSON.parse(event.privacySettings) : {}
      const updatedPrivacySettings = {
        ...currentPrivacySettings,
        allow_guest_viewing: guestCanViewAlbum
      }
      updateData.privacySettings = JSON.stringify(updatedPrivacySettings)
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Updating guestCanViewAlbum from ${event.guestCanViewAlbum} to ${guestCanViewAlbum}`)
        console.log(`🔄 Also updating privacySettings JSON: allow_guest_viewing=${guestCanViewAlbum}`)
      }
    }
    if (typeof approveUploads === 'boolean') updateData.approveUploads = approveUploads
    if (typeof guestCount === 'number') updateData.guestCount = guestCount
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl
    if (themeId) updateData.themeId = themeId
    if (typeof isPublished === 'boolean') updateData.isPublished = isPublished
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt
    if (privacySettings) updateData.privacySettings = privacySettings

    if (process.env.NODE_ENV === 'development') {
      console.log(`💾 About to update event with data:`, updateData)
    }

    const updatedEvent = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning()
      
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Event updated successfully:`, updatedEvent[0])
    }

    console.log(`Event settings updated for: ${event.slug}`)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗄️ Cache invalidated for event ${event.slug}: guestCanViewAlbum=${updateData.guestCanViewAlbum}`)
    }

    // Create response with aggressive cache-busting headers
    const response = Response.json({ 
      success: true, 
      event: updatedEvent[0],
      timestamp: Date.now() // Add timestamp for client-side cache busting
    })

    // Prevent any caching of this response
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Vary', '*')

    return response

  } catch (error) {
    console.error('Failed to update event settings:', error)
    return Response.json(
      { error: "Failed to update event settings" },
      { status: 500 }
    )
  }
}