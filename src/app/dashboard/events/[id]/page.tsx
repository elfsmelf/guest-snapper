import Link from "next/link"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/database/db"
import { uploads, albums, guestbookEntries } from "@/database/schema"
import { eq, and, count, countDistinct, sql } from "drizzle-orm"
import { getEventWithAccess } from "@/lib/auth-helpers"
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Image,
  Video,
  QrCode,
  ExternalLink,
  Settings,
  Upload,
  Eye,
  MessageSquare,
  Plus,
  Info,
  Download,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CopyButton } from "@/components/copy-button"
import { EventSettingsForm } from "@/components/event-settings-form"
import { QRCodeGenerator } from "@/components/qr-code-generator"
import { AlbumsSection } from "@/components/albums-section"
import { CollaboratorsSection } from "@/components/collaborators-section"
import { DownloadAllButton } from "@/components/download-all-button"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params
  
  // Server-side authentication check
  const session = await auth.api.getSession({
    headers: await headers()
  })

  const user = session?.user

  if (!user) {
    return null // This should be handled by layout redirect
  }

  // Fetch event details and statistics
  let event = null
  let isOwner = false
  let eventAlbums: any[] = []
  let stats = { 
    totalUploads: 0, 
    imageUploads: 0, 
    videoUploads: 0,
    approvedUploads: 0,
    guestCount: 0,
    guestbookEntries: 0 
  }

  try {
    const result = await getEventWithAccess(id, user.id)
    
    if (!result) {
      notFound()
    }
    
    event = result.event
    isOwner = result.isOwner

    // Fetch albums for this event
    eventAlbums = await db
      .select()
      .from(albums)
      .where(eq(albums.eventId, id))
      .orderBy(albums.sortOrder, albums.name)

    // Fetch comprehensive statistics
    const [
      totalUploadsResult,
      imageUploadsResult,
      videoUploadsResult,
      approvedUploadsResult,
      uniqueGuestsResult,
      guestbookResult
    ] = await Promise.all([
      // Total uploads
      db.select({ count: count() }).from(uploads).where(eq(uploads.eventId, id)),
      // Image uploads
      db.select({ count: count() }).from(uploads).where(
        and(eq(uploads.eventId, id), eq(uploads.fileType, 'image'))
      ),
      // Video uploads
      db.select({ count: count() }).from(uploads).where(
        and(eq(uploads.eventId, id), eq(uploads.fileType, 'video'))
      ),
      // Approved uploads
      db.select({ count: count() }).from(uploads).where(
        and(eq(uploads.eventId, id), eq(uploads.isApproved, true))
      ),
      // Unique contributors (by sessionId from uploads)
      db.select({ count: countDistinct(uploads.sessionId) }).from(uploads).where(
        and(eq(uploads.eventId, id), sql`${uploads.sessionId} IS NOT NULL`)
      ),
      // Guestbook entries
      db.select({ count: count() }).from(guestbookEntries).where(eq(guestbookEntries.eventId, id))
    ])

    stats.totalUploads = totalUploadsResult[0]?.count || 0
    stats.imageUploads = imageUploadsResult[0]?.count || 0
    stats.videoUploads = videoUploadsResult[0]?.count || 0
    stats.approvedUploads = approvedUploadsResult[0]?.count || 0
    stats.guestCount = uniqueGuestsResult[0]?.count || 0
    stats.guestbookEntries = guestbookResult[0]?.count || 0

  } catch (error) {
    console.error('Error loading event:', error)
    notFound()
  }

  const galleryUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/gallery/${event.slug}`
  const isUploadWindowOpen = new Date(event.uploadWindowEnd) > new Date()
  const isDownloadWindowOpen = new Date(event.downloadWindowEnd) > new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900">
        {/* Cover Image Background */}
        {event.coverImageUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-60"
            style={{ backgroundImage: `url(${event.coverImageUrl})` }}
          />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Content */}
        <div className="relative px-8 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {event.coupleNames}
            </h1>
            <div className="space-y-2">
              <p className="text-xl text-white/90">
                {event.name}
              </p>
              <p className="text-lg text-white/70">
                {new Date(event.eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              {event.venue && (
                <p className="text-white/70 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {event.venue}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Publishing Alert for Private Galleries */}
      {!event.isPublished && (
        <Alert className="text-left bg-yellow-50 border-yellow-200">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Gallery is Private:</strong> To make your gallery accessible to guests, go to the event settings, set an activation date, and click "Publish Event".
          </AlertDescription>
        </Alert>
      )}

      {/* Main Grid Layout */}
      <div className="grid gap-6 xl:grid-cols-4">
        {/* Main Content - Takes 3 columns */}
        <div className="xl:col-span-3 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your gallery</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button size="sm" asChild>
                  <Link href={`/gallery/${event.slug}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Gallery
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/gallery/${event.slug}/upload`}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photos
                  </Link>
                </Button>
                <CopyButton text={galleryUrl} variant="outline">
                  Copy Gallery Link
                </CopyButton>
              </div>
            </CardContent>
          </Card>

          {/* Event Settings */}
          <EventSettingsForm event={event as any} calculatedGuestCount={stats.guestCount} />

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                  <Image className="h-4 w-4" />
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
                <div className="text-2xl font-bold">{stats.guestCount} / {event.guestCount || 0}</div>
                <p className="text-xs text-muted-foreground">Contributors / Limit</p>
              </CardContent>
            </Card>

            <Card>
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

          {/* Albums */}
          <Card>
            <CardHeader>
              <CardTitle>Albums</CardTitle>
              <CardDescription>
                Organize photos and videos into albums
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlbumsSection eventId={event.id} initialAlbums={eventAlbums} />
            </CardContent>
          </Card>

          {/* Collaborators */}
          <CollaboratorsSection eventId={event.id} isOwner={isOwner} />
        </div>

        {/* Sidebar - Takes 1 column */}
        <div className="space-y-6">
          {/* Gallery Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Upload className="mr-2 h-5 w-5" />
                Gallery Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Publication Status */}
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-sm font-medium">Publication Status:</span>
                <Badge 
                  variant={event.isPublished ? 'default' : 'destructive'}
                  className={event.isPublished ? '' : 'bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-semibold'}
                >
                  {event.isPublished ? 'Published' : 'Private'}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Upload Window Ends:</span>
                  <span className="font-medium">
                    {new Date(event.uploadWindowEnd).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Download Window Ends:</span>
                  <span className="font-medium">
                    {new Date(event.downloadWindowEnd).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Theme:</span>
                  <span className="font-medium capitalize">{event.themeId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Slideshow:</span>
                  <span className="font-medium">
                    {event.realtimeSlideshow ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code & Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <QrCode className="mr-2 h-5 w-5" />
                QR Code & Sharing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Gallery URL:</label>
                <div className="flex items-center space-x-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    {galleryUrl}
                  </code>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={galleryUrl} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <QRCodeGenerator value={galleryUrl} />
            </CardContent>
          </Card>

          {/* Download All Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Download className="mr-2 h-5 w-5" />
                Download All Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Download all approved photos and videos from this event as a ZIP file.
              </p>
              <DownloadAllButton 
                eventId={event.id}
                fileCount={stats.approvedUploads}
                disabled={stats.approvedUploads === 0}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}