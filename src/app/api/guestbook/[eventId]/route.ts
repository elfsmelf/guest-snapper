import { NextRequest, NextResponse } from "next/server"
import { db } from "@/database/db"
import { guestbookEntries } from "@/database/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

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