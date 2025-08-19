import { db } from "@/database/db"
import { uploads } from "@/database/schema"
import { eq, count } from "drizzle-orm"
import { DeleteEventDialog } from "@/components/delete-event-dialog"

interface DeleteEventWrapperProps {
  eventId: string
  eventName: string
  coupleNames: string
}

export default async function DeleteEventWrapper({ 
  eventId, 
  eventName, 
  coupleNames 
}: DeleteEventWrapperProps) {
  // Fetch upload count
  const uploadCountResult = await db
    .select({ count: count() })
    .from(uploads)
    .where(eq(uploads.eventId, eventId))

  const uploadsCount = uploadCountResult[0]?.count || 0

  return (
    <DeleteEventDialog
      eventId={eventId}
      eventName={eventName}
      coupleNames={coupleNames}
      uploadsCount={uploadsCount}
    />
  )
}