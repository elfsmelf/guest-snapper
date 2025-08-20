import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { Suspense } from "react"
import type { Metadata } from 'next'
import { auth } from "@/lib/auth"
import { db } from "@/database/db"
import { albums } from "@/database/schema"
import { eq } from "drizzle-orm"
import { getEventWithAccess } from "@/lib/auth-helpers"
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Image as ImageIcon,
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
  Presentation,
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
import { PaymentSuccessHandler } from "@/components/payment-success-handler"
import { QuickActionsClient } from "@/components/quick-actions-client"
import dynamic from 'next/dynamic'

// Dynamically import heavy client components
const QRCodeGenerator = dynamic(
  () => import('@/components/qr-code-generator').then(m => ({ default: m.QRCodeGenerator })),
  { 
    loading: () => (
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="w-48 h-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-2">
          <div className="h-9 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }
)
import { AlbumsSection } from "@/components/albums-section"
import { CollaboratorsSection } from "@/components/collaborators-section"
import { DownloadAllButton } from "@/components/download-all-button"
const SlideshowSettings = dynamic(
  () => import('@/components/slideshow-settings').then(m => ({ default: m.SlideshowSettings })),
  { 
    loading: () => (
      <div className="animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-16 bg-gray-200 rounded" />
          <div className="h-4 w-3/4 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }
)
import EventStatsGrid from "@/components/event-stats-grid"
import DeleteEventWrapper from "@/components/delete-event-wrapper"
import { 
  EventSettingsSkeleton, 
  StatsSkeleton, 
  AlbumsSkeleton, 
  CollaboratorsSkeleton, 
  SidebarSkeleton 
} from "@/components/skeletons/dashboard-skeletons"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    return {
      title: 'Dashboard - Authentication Required',
      description: 'Please sign in to access the dashboard'
    }
  }

  try {
    // Get event data for metadata
    const result = await getEventWithAccess(id, session.user.id)
    
    if (!result) {
      return {
        title: 'Event Not Found',
        description: 'The requested event could not be found'
      }
    }

    const { event } = result

    return {
      title: `${event.coupleNames} - ${event.name} | Dashboard`,
      description: `Manage your event gallery for ${event.name}. View uploads, manage settings, and share with guests.`,
      openGraph: {
        title: `${event.coupleNames} - ${event.name}`,
        description: `Event dashboard for ${event.name}`,
        images: event.coverImageUrl ? [{
          url: event.coverImageUrl,
          width: 1200,
          height: 630,
          alt: `${event.coupleNames} - ${event.name}`
        }] : undefined,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${event.coupleNames} - ${event.name}`,
        description: `Event dashboard for ${event.name}`,
        images: event.coverImageUrl ? [event.coverImageUrl] : undefined,
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Dashboard Event',
      description: 'Event dashboard'
    }
  }
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

  // Fetch event details and albums
  let event = null
  let isOwner = false
  let eventAlbums: any[] = []

  try {
    const [eventResult, albumsResult] = await Promise.all([
      getEventWithAccess(id, user.id),
      db.select().from(albums).where(eq(albums.eventId, id)).orderBy(albums.sortOrder, albums.name)
    ])
    
    if (!eventResult) {
      notFound()
    }
    
    event = eventResult.event
    isOwner = eventResult.isOwner
    eventAlbums = albumsResult

  } catch (error) {
    console.error('Error loading event:', error)
    notFound()
  }

  const galleryUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/gallery/${event.slug}`
  const isUploadWindowOpen = new Date(event.uploadWindowEnd) > new Date()
  const isDownloadWindowOpen = new Date(event.downloadWindowEnd) > new Date()

  return (
    <div className="w-full overflow-hidden space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild className="text-xs sm:text-sm">
          <Link href="/dashboard">
            <ArrowLeft className="mr-1.5 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl h-64 md:h-80 lg:h-96 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900">
        {/* Cover Image Background */}
        {event.coverImageUrl && (
          <Image
            src={event.coverImageUrl}
            alt={`${event.coupleNames} - ${event.name}`}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-60"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7XTvtd0535YH9jyJ6Oz/2Q=="
          />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Content */}
        <div className="relative px-4 sm:px-8 py-8 sm:py-12">
          <div className="max-w-4xl">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
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
      <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-4 w-full min-w-0">
        {/* Main Content - Takes 3 columns */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6 min-w-0">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your gallery</CardDescription>
            </CardHeader>
            <CardContent>
              <QuickActionsClient eventSlug={event.slug} galleryUrl={galleryUrl} />
            </CardContent>
          </Card>

          {/* Event Settings */}
          <Suspense fallback={<EventSettingsSkeleton />}>
            <EventSettingsForm event={event as any} calculatedGuestCount={0} />
          </Suspense>
          
          {/* Payment Success Handler */}
          <PaymentSuccessHandler 
            eventId={event.id}
            currentPlan={event.plan}
            eventCurrency={event.currency as any}
          />

          {/* Statistics Grid */}
          <Suspense fallback={<StatsSkeleton />}>
            <EventStatsGrid eventId={event.id} guestCount={event.guestCount || 0} />
          </Suspense>

          {/* Albums */}
          <Suspense fallback={<AlbumsSkeleton />}>
            <Card>
              <CardHeader>
                <CardTitle>Albums</CardTitle>
                <CardDescription>
                  Organize photos and videos into albums
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlbumsSection 
                  eventId={event.id} 
                  initialAlbums={eventAlbums} 
                  event={{
                    id: event.id,
                    plan: event.plan,
                    currency: event.currency as any,
                    guestCount: event.guestCount || 0,
                    isPublished: event.isPublished
                  }}
                />
              </CardContent>
            </Card>
          </Suspense>

          {/* Collaborators */}
          <Suspense fallback={<CollaboratorsSkeleton />}>
            <CollaboratorsSection eventId={event.id} isOwner={isOwner} />
          </Suspense>

          {/* Danger Zone - Only show to event owner */}
          {isOwner && (
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions for this event.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                    <h4 className="font-medium text-destructive mb-2">Delete Event</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently delete this event and all associated data including photos, videos, 
                      audio messages, guestbook entries, and storage files. This cannot be undone.
                    </p>
                    <Suspense fallback={<div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />}>
                      <DeleteEventWrapper
                        eventId={event.id}
                        eventName={event.name}
                        coupleNames={event.coupleNames}
                      />
                    </Suspense>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Takes 1 column */}
        <Suspense fallback={<SidebarSkeleton />}>
          <div className="space-y-6 min-w-0 w-full">
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
                    <code className="text-xs bg-muted px-1.5 py-1 rounded flex-1 truncate block overflow-hidden">
                      {galleryUrl}
                    </code>
                    <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                      <Link href={galleryUrl} target="_blank">
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <QRCodeGenerator value={galleryUrl} />
              </CardContent>
            </Card>

            {/* Slideshow Settings */}
            <SlideshowSettings 
              eventId={event.id}
              eventSlug={event.slug}
              currentDuration={(event as any).slideDuration || 5}
              hasPhotos={true} // Will be determined by the component itself
            />

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
                  fileCount={0} // Will be determined by the component itself
                  disabled={false} // Will be determined by the component itself
                />
              </CardContent>
            </Card>
          </div>
        </Suspense>
      </div>
    </div>
  )
}