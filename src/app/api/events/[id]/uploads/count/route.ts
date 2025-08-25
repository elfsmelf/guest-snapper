import { NextRequest, NextResponse } from "next/server"
import { db } from "@/database/db"
import { uploads } from "@/database/schema"
import { eq, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params
    
    // Get session
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    // Count uploads for this event
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(uploads)
      .where(eq(uploads.eventId, eventId))
      .limit(1)
    
    const count = result[0]?.count || 0
    
    return NextResponse.json({ 
      success: true, 
      count: Number(count),
      isOwner: session?.user?.id ? true : false 
    })
  } catch (error) {
    console.error('Error counting uploads:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to count uploads' 
    }, { status: 500 })
  }
}