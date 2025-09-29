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
  EyeOff,
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
import { GalleryThemeManager } from "@/components/gallery-theme-manager"
import { CoverImageUpload } from "@/components/cover-image-upload"
import { QRCodeGeneratorClient } from "@/components/qr-code-generator-client"
import { updateEventTheme } from "@/app/actions/update-theme"
import type { Currency } from "@/lib/pricing"
import { formatEventTitle, getEventTypeInfo } from "@/lib/event-types"
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
      title: formatEventTitle(event.coupleNames, event.eventType || 'wedding'),
      description: `Manage your event gallery for ${formatEventTitle(event.coupleNames, event.eventType || 'wedding')}. View uploads, manage settings, and share with guests.`,
      openGraph: {
        title: formatEventTitle(event.coupleNames, event.eventType || 'wedding'),
        description: `Event dashboard for ${formatEventTitle(event.coupleNames, event.eventType || 'wedding')}`,
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
        title: formatEventTitle(event.coupleNames, event.eventType || 'wedding'),
        description: `Event dashboard for ${formatEventTitle(event.coupleNames, event.eventType || 'wedding')}`,
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
      <div className="relative overflow-hidden rounded-xl">
        {/* Cover Image Background */}
        {event.coverImageUrl ? (
          <div className="overflow-hidden" style={{ height: '600px' }}>
            <Image
              src={event.coverImageUrl}
              alt={`${event.coupleNames} - ${event.name}`}
              width={1200}
              height={675}
              priority
              sizes="100vw"
              className="w-full h-full object-cover object-center"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7XTvtd0535YH9jyJ6Oz/2Q=="
            />
          </div>
        ) : (
          // Fallback gradient background when no cover image
          <div style={{ height: '600px' }} className="bg-gradient-to-br from-primary/90 via-primary to-primary/90 dark:from-primary/70 dark:via-primary/80 dark:to-primary/70" />
        )}
        
        {/* Pattern overlay when no cover image */}
        {!event.coverImageUrl && (
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, var(--primary-foreground) 1px, transparent 1px)`,
              backgroundSize: '32px 32px'
            }}
          />
        )}
        
        {/* Black overlay for text readability */}
        <div className={`absolute inset-0 ${
          event.coverImageUrl 
            ? "bg-black/40"
            : "bg-gradient-to-t from-black/40 via-black/20 to-transparent"
        }`} />
        
        {/* Content */}
        <div className="absolute inset-0 px-6 py-10 sm:px-8 sm:py-12 flex flex-col justify-end">
          <div className="max-w-4xl">
            <h1 className="text-xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-4 drop-shadow-lg font-serif">
              {event.name}
            </h1>
            <div className="space-y-2 sm:space-y-3">
              <p className="text-base sm:text-xl text-white/95 font-medium drop-shadow flex items-center gap-2">
                {(() => {
                  const EventIcon = getEventTypeInfo(event.eventType || 'wedding').icon
                  return <EventIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                })()}
                {getEventTypeInfo(event.eventType || 'wedding').label}
              </p>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
                <p className="text-sm sm:text-lg text-white/90 flex items-center gap-2 drop-shadow">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="truncate">
                    {new Date(event.eventDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </p>
                {event.venue && (
                  <p className="text-sm sm:text-base text-white/90 flex items-center gap-2 drop-shadow">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </p>
                )}
              </div>
            </div>
            
            {/* Hero Action Buttons */}
            <div className="mt-4 sm:mt-8 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button asChild size="default" className="bg-white text-gray-900 hover:bg-white/90 shadow-lg w-full sm:w-auto">
                <Link href={galleryUrl} target="_blank" prefetch={false}>
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  View Gallery
                </Link>
              </Button>
              <CopyButton
                text={galleryUrl}
                variant="secondary"
                size="default"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 shadow-lg backdrop-blur-sm w-full sm:w-auto"
              >
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="sm:hidden">Copy Link</span>
                <span className="hidden sm:inline">Copy Gallery Link</span>
              </CopyButton>
              <Button asChild variant="secondary" size="default" className="bg-white/10 text-white border-white/20 hover:bg-white/20 shadow-lg backdrop-blur-sm w-full sm:w-auto">
                <Link href={`/gallery/${event.slug}/upload`} prefetch={false}>
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Upload Media
                </Link>
              </Button>
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

      {/* Main Grid Layout - Flexbox on mobile, Grid on desktop */}
      <div className="flex flex-col lg:grid gap-6 lg:grid-cols-3 xl:grid-cols-4 w-full min-w-0">
        {/* Main Content Section - but items can be reordered on mobile */}
        <div className="contents lg:block lg:col-span-2 xl:col-span-3 lg:space-y-6 min-w-0">
          {/* 1. Event Settings (Event Details, Privacy and Moderation) */}
          <div className="order-1 lg:order-none" data-section="event-details">
          <Suspense fallback={<EventSettingsSkeleton />}>
            <EventSettingsForm event={event as any} calculatedGuestCount={0} />
          </Suspense>
          
          {/* Payment Success Handler */}
          <PaymentSuccessHandler 
            eventId={event.id}
            currentPlan={event.plan}
            eventCurrency={event.currency as any}
          />
          </div>

          {/* 3. Gallery Cover Image */}
          <div className="order-3 lg:order-none" data-section="gallery-cover-image">
            <CoverImageUpload event={event as any} />
          </div>

          {/* 4. Theme Manager */}
          <div className="order-4 lg:order-none" data-section="gallery-theme-manager">
          <GalleryThemeManager
            eventId={event.id}
            currentThemeId={event.themeId || 'default'}
            eventData={{
              coupleNames: event.coupleNames,
              eventDate: event.eventDate,
              coverImageUrl: event.coverImageUrl || undefined
            }}
            onThemeChange={async (themeId: string) => {
              "use server"
              await updateEventTheme(event.id, themeId)
            }}
          />
          </div>

          {/* 5. Albums Management - Temporarily disabled for debugging */}
          <div className="order-5 lg:order-none" data-section="albums-management">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <ImageIcon className="mr-2 h-5 w-5" />
                  Photo Albums
                </CardTitle>
                <CardDescription>
                  Organize your event photos into custom albums for better navigation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlbumsSection
                  eventId={event.id}
                  initialAlbums={eventAlbums}
                  event={{
                    id: event.id,
                    plan: event.plan,
                    currency: event.currency as Currency,
                    guestCount: event.guestCount ?? undefined,
                    isPublished: event.isPublished
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* 6. Stats */}
          <div className="order-6 lg:order-none" data-section="event-stats">
          <Suspense fallback={<StatsSkeleton />}>
            <EventStatsGrid eventId={event.id} guestCount={event.guestCount || 0} />
          </Suspense>
          </div>

          {/* 7. Collaborators */}
          <div className="order-7 lg:order-none" data-section="collaborators-section">
          <Suspense fallback={<CollaboratorsSkeleton />}>
            <CollaboratorsSection eventId={event.id} isOwner={isOwner} />
          </Suspense>
          </div>

          {/* 8. Danger Zone - Only show to event owner */}
          {isOwner && (
            <div className="order-8 lg:order-none">
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
            </div>
          )}
        </div>

        {/* Sidebar - Takes 1 column, but items can be reordered on mobile */}
        <Suspense fallback={<SidebarSkeleton />}>
          <div className="contents lg:block lg:space-y-6 min-w-0 w-full">
            {/* 2. Publication Status */}
            <Card className="order-2 lg:order-none" data-section="publication-status">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Upload className="mr-2 h-5 w-5" />
                  Publication Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-sm font-medium">Status:</span>
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
                </div>
              </CardContent>
            </Card>

            {/* 9. QR Code */}
            <Card className="order-9 lg:order-none" data-section="qr-code-sharing">
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
                      <Link href={galleryUrl} target="_blank" prefetch={false}>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <QRCodeGeneratorClient
                  value={galleryUrl}
                  eventId={event.id}
                />
              </CardContent>
            </Card>

            {/* 10. Slideshow */}
            <div className="order-10 lg:order-none" data-section="slideshow-settings">
              <SlideshowSettings
                eventId={event.id}
                eventSlug={event.slug}
                currentDuration={(event as any).slideDuration || 5}
                hasPhotos={true} // Will be determined by the component itself
              />
            </div>

            {/* 11. Download All Files */}
            <Card className="order-11 lg:order-none">
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