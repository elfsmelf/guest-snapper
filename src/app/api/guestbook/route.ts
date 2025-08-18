import { NextRequest, NextResponse } from "next/server"
import { db } from "@/database/db"
import { guestbookEntries, events } from "@/database/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    // Get the current session (should be anonymous user)
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

    // Create guestbook entry with anonymous user tracking
    const newEntry = await db
      .insert(guestbookEntries)
      .values({
        eventId,
        sessionId: session?.user?.id || null, // Track anonymous user ID
        guestName: guestName.trim(),
        message: message.trim(),
        isApproved: true, // Auto-approve for now
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

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