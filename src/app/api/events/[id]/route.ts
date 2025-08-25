import { db } from "@/database/db"
import { events } from "@/database/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { validateEventAccess } from "@/lib/auth-helpers"

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