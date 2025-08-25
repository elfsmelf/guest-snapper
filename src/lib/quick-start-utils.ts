import { db } from "@/database/db"
import { uploads } from "@/database/schema"
import { eq, count } from "drizzle-orm"

/**
 * Server-side function to check test photos count
 */
export async function getTestPhotosCount(eventId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(uploads)
      .where(eq(uploads.eventId, eventId))
    
    return result[0]?.count || 0
  } catch (error) {
    console.error('Error checking test photos count:', error)
    return 0
  }
}