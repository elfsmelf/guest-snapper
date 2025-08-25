import { db } from "@/database/db"
import { uploads, guestbookEntries, guests } from "@/database/schema"
import { eq, and, count, countDistinct, sql, isNotNull } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Image as ImageIcon, Video, Users, MessageSquare } from "lucide-react"

interface EventStatsGridProps {
  eventId: string
  guestCount: number
}

export const revalidate = 60 // Cache for 1 minute

export default async function EventStatsGrid({ eventId, guestCount }: EventStatsGridProps) {
  // Fetch comprehensive statistics in parallel
  const [
    totalUploadsResult,
    imageUploadsResult,
    videoUploadsResult,
    approvedUploadsResult,
    uniqueGuestsResult,
    guestbookResult
  ] = await Promise.all([
    // Total uploads
    db.select({ count: count() }).from(uploads).where(eq(uploads.eventId, eventId)),
    // Image uploads
    db.select({ count: count() }).from(uploads).where(
      and(eq(uploads.eventId, eventId), eq(uploads.fileType, 'image'))
    ),
    // Video uploads
    db.select({ count: count() }).from(uploads).where(
      and(eq(uploads.eventId, eventId), eq(uploads.fileType, 'video'))
    ),
    // Approved uploads
    db.select({ count: count() }).from(uploads).where(
      and(eq(uploads.eventId, eventId), eq(uploads.isApproved, true))
    ),
    // Unique guests only (count from guests table, not uploads)
    db.select({ count: count() }).from(guests).where(eq(guests.eventId, eventId)),
    // Guestbook entries
    db.select({ count: count() }).from(guestbookEntries).where(eq(guestbookEntries.eventId, eventId))
  ])

  const stats = {
    totalUploads: totalUploadsResult[0]?.count || 0,
    imageUploads: imageUploadsResult[0]?.count || 0,
    videoUploads: videoUploadsResult[0]?.count || 0,
    approvedUploads: approvedUploadsResult[0]?.count || 0,
    guestCount: uniqueGuestsResult[0]?.count || 0,
    guestbookEntries: guestbookResult[0]?.count || 0
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUploads}</div>
          <p className="text-xs text-muted-foreground">All media files</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.imageUploads}</div>
          <p className="text-xs text-muted-foreground">Image files</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Video className="h-4 w-4" />
            Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.videoUploads}</div>
          <p className="text-xs text-muted-foreground">Video files</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Guests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.guestCount} / {guestCount || 0}</div>
          <p className="text-xs text-muted-foreground">Contributors / Limit</p>
        </CardContent>
      </Card>

      <Card className="col-span-2 sm:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.guestbookEntries}</div>
          <p className="text-xs text-muted-foreground">Guestbook entries</p>
        </CardContent>
      </Card>
    </div>
  )
}