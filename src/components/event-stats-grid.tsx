import { db } from "@/database/db"
import { uploads, guestbookEntries, guests } from "@/database/schema"
import { eq, and, count, countDistinct, sql, isNotNull } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Image as ImageIcon, Video, Users, MessageSquare, HardDrive } from "lucide-react"
import { getPlanFeatures } from "@/lib/pricing"

interface EventStatsGridProps {
  eventId: string
  guestCount: number
  plan?: string | null
}

export const revalidate = 60 // Cache for 1 minute

export default async function EventStatsGrid({ eventId, guestCount, plan }: EventStatsGridProps) {
  // Fetch comprehensive statistics in parallel
  const [
    totalUploadsResult,
    imageUploadsResult,
    videoUploadsResult,
    approvedUploadsResult,
    uniqueGuestsResult,
    guestbookResult,
    totalStorageResult
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
    db.select({ count: count() }).from(guestbookEntries).where(eq(guestbookEntries.eventId, eventId)),
    // Total storage used
    db.select({ total: sql<number>`COALESCE(SUM(${uploads.fileSize}), 0)` }).from(uploads).where(eq(uploads.eventId, eventId))
  ])

  const totalStorageBytes = Number(totalStorageResult[0]?.total || 0)
  const totalStorageMB = totalStorageBytes / (1024 * 1024)
  const totalStorageGB = totalStorageMB / 1024

  // Get plan features for storage limit
  const planFeatures = getPlanFeatures(plan || 'free_trial')
  const storageLimitMB = planFeatures.storageLimit
  const storageLimitGB = storageLimitMB / 1024
  const storagePercentage = storageLimitMB === 999999 ? 0 : (totalStorageMB / storageLimitMB) * 100

  // Determine if we should show GB or MB based on limit size
  const useGBDisplay = storageLimitMB >= 1024 // If limit is 1GB or more, show in GB

  const stats = {
    totalUploads: totalUploadsResult[0]?.count || 0,
    imageUploads: imageUploadsResult[0]?.count || 0,
    videoUploads: videoUploadsResult[0]?.count || 0,
    approvedUploads: approvedUploadsResult[0]?.count || 0,
    guestCount: uniqueGuestsResult[0]?.count || 0,
    guestbookEntries: guestbookResult[0]?.count || 0,
    totalStorageMB,
    totalStorageGB,
    storageLimitMB,
    storageLimitGB,
    storagePercentage,
    useGBDisplay
  }

  return (
    <div className="space-y-4">
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

      {/* Storage Usage Card */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold">
                {stats.useGBDisplay
                  ? `${stats.totalStorageGB.toFixed(2)} GB`
                  : `${stats.totalStorageMB.toFixed(1)} MB`
                }
              </div>
              <p className="text-xs text-muted-foreground">
                of {stats.storageLimitMB === 999999
                  ? '∞'
                  : stats.useGBDisplay
                    ? `${stats.storageLimitGB.toFixed(0)} GB`
                    : `${stats.storageLimitMB} MB`
                }
              </p>
            </div>
            {stats.storageLimitMB !== 999999 && (
              <div className="text-right">
                <div className={`text-lg font-semibold ${stats.storagePercentage > 90 ? 'text-destructive' : stats.storagePercentage > 75 ? 'text-[oklch(0.7227_0.1502_60.5799)]' : 'text-primary'}`}>
                  {stats.storagePercentage.toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">used</p>
              </div>
            )}
          </div>
          {stats.storageLimitMB !== 999999 && (
            <div>
              <Progress
                value={Math.min(stats.storagePercentage, 100)}
                className="h-2"
                indicatorClassName={
                  stats.storagePercentage > 90 ? 'bg-destructive' :
                  stats.storagePercentage > 75 ? 'bg-[oklch(0.7227_0.1502_60.5799)]' :
                  'bg-primary'
                }
              />
              {stats.storagePercentage > 90 && (
                <p className="text-xs text-destructive mt-2">
                  Storage nearly full! Contact support to increase your storage limit.
                </p>
              )}
            </div>
          )}
          {stats.storageLimitMB === 999999 && (
            <p className="text-xs text-muted-foreground">
              Unlimited storage on your plan
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}