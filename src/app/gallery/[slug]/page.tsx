import { notFound } from 'next/navigation'
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { canUserAccessEvent } from "@/lib/auth-helpers"
import { getCachedEventData, getCachedGalleryData } from "@/lib/gallery-cache"
import { GalleryView } from "@/components/gallery/gallery-view"
import { AutoRefreshGallery } from "@/components/gallery/auto-refresh-gallery"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Eye, Camera, MessageSquare } from "lucide-react"

interface GalleryPageProps {
  params: Promise<{ slug: string }>
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { slug } = await params
  
  // Check if current user has access to this event (owner or organization member)
  const session = await auth.api.getSession({
    headers: await headers()
  })

  // Get cached event data
  const eventWithAlbums = await getCachedEventData(slug, false) // We'll check access separately
  
  if (!eventWithAlbums) {
    notFound()
  }

  const isOwner = session?.user?.id === eventWithAlbums.userId
  const hasEventAccess = session?.user ? await canUserAccessEvent(eventWithAlbums.id, session.user.id) : false

  // Get cached gallery data
  const galleryData = await getCachedGalleryData(eventWithAlbums.id, hasEventAccess)

  // If gallery is not published and user doesn't have access, show draft message
  if (!eventWithAlbums.isPublished && !hasEventAccess) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            {/* Cover Image */}
            {eventWithAlbums.coverImageUrl && (
              <div className="mb-8">
                <img
                  src={eventWithAlbums.coverImageUrl}
                  alt={`${eventWithAlbums.coupleNames} - ${eventWithAlbums.name}`}
                  className="w-full h-64 object-cover rounded-lg shadow-md opacity-75"
                />
              </div>
            )}
            
            {/* Event Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{eventWithAlbums.coupleNames}</h1>
              <p className="text-lg text-gray-600 mb-4">{eventWithAlbums.name}</p>
              <p className="text-gray-500">
                {new Date(eventWithAlbums.eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* Draft Message */}
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                  <Eye className="w-8 h-8 text-pink-500" />
                </div>
                <CardTitle className="text-xl text-gray-900">Gallery Coming Soon</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  This gallery is currently being prepared by the hosts. Check back soon to view and share photos from this special celebration!
                </p>
                
                {eventWithAlbums.activationDate && (
                  <div className="p-3 rounded-lg bg-pink-50 border border-pink-200">
                    <p className="text-sm text-pink-800">
                      <strong>Expected to go live:</strong><br />
                      {new Date(eventWithAlbums.activationDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                
                <p className="text-sm text-gray-500">
                  Bookmark this page to easily return when the gallery is ready.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // If guest viewing is disabled and user doesn't have access, show privacy message
  if (!eventWithAlbums.guestCanViewAlbum && !hasEventAccess) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            {/* Cover Image */}
            {eventWithAlbums.coverImageUrl && (
              <div className="mb-8">
                <img
                  src={eventWithAlbums.coverImageUrl}
                  alt={`${eventWithAlbums.coupleNames} - ${eventWithAlbums.name}`}
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                />
              </div>
            )}
            
            {/* Event Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{eventWithAlbums.coupleNames}</h1>
              <p className="text-lg text-gray-600 mb-4">{eventWithAlbums.name}</p>
              <p className="text-gray-500">
                {new Date(eventWithAlbums.eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* Privacy Message */}
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-gray-400" />
                </div>
                <CardTitle className="text-xl text-gray-900">Gallery is Private</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  The hosts have temporarily disabled public viewing of their photo gallery. 
                  You can still contribute photos and messages to celebrate with them!
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild className="bg-pink-500 hover:bg-pink-600">
                    <a href={`/gallery/${slug}/upload`}>
                      <Camera className="w-4 h-4 mr-2" />
                      Share Photos
                    </a>
                  </Button>
                  <Button variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Leave Message
                  </Button>
                </div>
                
                <p className="text-sm text-gray-500 mt-4">
                  Photos and messages you share will be visible to the hosts and may be made public later.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Owner/Member badge */}
      {hasEventAccess && (
        <div className={`border-b ${isOwner ? 'bg-yellow-50 border-yellow-200' : 'bg-purple-50 border-purple-200'}`}>
          <div className="container mx-auto px-4 py-2">
            <p className={`text-sm ${isOwner ? 'text-yellow-800' : 'text-purple-800'} flex items-center justify-center gap-2`}>
              <span className={isOwner ? 'text-yellow-600' : 'text-purple-600'}>
                {isOwner ? '👑' : '🤝'}
              </span>
              <strong>{isOwner ? 'Gallery Owner:' : 'Organization Member:'}</strong> You can view and manage this gallery even when public viewing is disabled.
            </p>
          </div>
        </div>
      )}
      
      {/* Auto-refresh component for polling */}
      <AutoRefreshGallery interval={30000} />
      
      <GalleryView 
        event={eventWithAlbums as any}
        uploads={galleryData.uploads as any}
        pendingUploads={galleryData.pendingUploads as any}
        eventSlug={slug}
        isOwner={isOwner}
        hasEventAccess={hasEventAccess}
      />
    </div>
  )
}