import { NextRequest, NextResponse } from "next/server"
import { db } from "@/database/db"
import { guestbookEntries, events } from "@/database/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { PostHog } from 'posthog-node'

const posthogClient = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  { host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com' }
)

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth.api.getSession({
      headers: await headers()
    })

    const body = await request.json()
    const { eventId, guestName, message } = body

    // Validate input
    if (!eventId || !guestName?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Event ID, guest name, and message are required" },
        { status: 400 }
      )
    }

    // Verify event exists
    const eventResult = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!eventResult.length) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    }

    // Create guestbook entry
    const newEntry = await db
      .insert(guestbookEntries)
      .values({
        eventId,
        sessionId: session?.user?.id || null, // Track user ID if authenticated
        guestName: guestName.trim(),
        message: message.trim(),
        isApproved: true, // Auto-approve for now
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    // Track guestbook message in PostHog
    const event = eventResult[0]
    const distinctId = session?.user?.id || `guest_${guestName.trim()}`
    posthogClient.capture({
      distinctId,
      event: 'guestbook_message_created',
      properties: {
        event_id: eventId,
        event_slug: event.slug,
        message_length: message.trim().length,
        is_authenticated: !!session?.user?.id,
        guest_name: guestName.trim(),
      }
    })

    // Don't wait for PostHog shutdown for performance
    posthogClient.shutdown()

    return NextResponse.json({
      success: true,
      entry: newEntry[0]
    })

  } catch (error) {
    console.error('Failed to create guestbook entry:', error)
    return NextResponse.json(
      { error: "Failed to create guestbook entry" },
      { status: 500 }
    )
  }
}