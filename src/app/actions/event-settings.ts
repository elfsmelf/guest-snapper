"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/database/db"
import { events } from "@/database/schema"
import { eq } from "drizzle-orm"
import { canUserAccessEvent } from "@/lib/auth-helpers"

export async function updateSlideDuration(eventId: string, duration: number) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    // Validate duration
    const validDurations = [5, 10, 15, 20, 30]
    if (!validDurations.includes(duration)) {
      return { success: false, error: "Invalid duration value" }
    }

    // Check if user has access to this event
    const hasAccess = await canUserAccessEvent(eventId, session.user.id)
    if (!hasAccess) {
      return { success: false, error: "Access denied" }
    }

    // Get the event for logging
    const event = await db
      .select({ slug: events.slug })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    // Update the slide duration
    await db
      .update(events)
      .set({ 
        slideDuration: duration,
        updatedAt: new Date().toISOString()
      })
      .where(eq(events.id, eventId))

    // Revalidate the gallery and slideshow pages
    if (event.length > 0) {
      console.log(`Slide duration updated for event: ${event[0].slug}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating slide duration:', error)
    return { success: false, error: "Failed to update slide duration" }
  }
}