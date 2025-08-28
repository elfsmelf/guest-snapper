"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/database/db"
import { events } from "@/database/schema"
import { eq } from "drizzle-orm"
import { canUserAccessEvent } from "@/lib/auth-helpers"
import { GALLERY_THEMES } from "@/lib/gallery-themes"

export async function updateEventTheme(eventId: string, themeId: string) {
  try {
    // Validate theme exists
    if (!GALLERY_THEMES[themeId]) {
      throw new Error("Invalid theme selected")
    }

    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    // Get event to check permissions
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!event) {
      throw new Error("Event not found")
    }

    // Check if user is owner or has access
    const isOwner = session.user.id === event.userId
    const hasAccess = await canUserAccessEvent(eventId, session.user.id)

    if (!isOwner && !hasAccess) {
      throw new Error("Unauthorized to modify this event")
    }

    // Update the theme
    await db
      .update(events)
      .set({ 
        themeId,
        updatedAt: new Date().toISOString()
      })
      .where(eq(events.id, eventId))

    // Revalidate the gallery pages
    console.log(`Theme updated for event: ${event.slug} to ${themeId}`)

    return { success: true }
  } catch (error) {
    console.error("Error updating event theme:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to update theme")
  }
}