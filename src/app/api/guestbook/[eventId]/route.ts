import { NextRequest, NextResponse } from "next/server"
import { db } from "@/database/db"
import { guestbookEntries, events } from "@/database/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    // Check if guests can view guestbook for this event
    const event = await db
      .select({
        guestCanViewGuestbook: events.guestCanViewGuestbook,
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!event.length || event[0].guestCanViewGuestbook === false) {
      return NextResponse.json({
        success: false,
        entries: [],
        message: "Guestbook viewing is disabled for this event"
      })
    }

    // Get all approved guestbook entries for this event
    const entries = await db
      .select({
        id: guestbookEntries.id,
        guestName: guestbookEntries.guestName,
        message: guestbookEntries.message,
        isApproved: guestbookEntries.isApproved,
        createdAt: guestbookEntries.createdAt,
      })
      .from(guestbookEntries)
      .where(eq(guestbookEntries.eventId, eventId))
      .orderBy(desc(guestbookEntries.createdAt))

    return NextResponse.json({
      success: true,
      entries
    })

  } catch (error) {
    console.error('Failed to fetch guestbook entries:', error)
    return NextResponse.json(
      { error: "Failed to fetch guestbook entries" },
      { status: 500 }
    )
  }
}