import { notFound } from 'next/navigation'
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { canUserAccessEvent } from "@/lib/auth-helpers"
import { getCachedEventData, getCachedGalleryData } from "@/lib/gallery-cache"
import { SlideshowView } from "@/components/gallery/slideshow-view"

interface SlideshowPageProps {
  params: Promise<{ slug: string }>
}

export default async function SlideshowPage({ params }: SlideshowPageProps) {
  const { slug } = await params
  
  // Check if current user has access to this event (owner or organization member)
  const session = await auth.api.getSession({
    headers: await headers()
  })

  // Get cached event data
  const eventWithAlbums = await getCachedEventData(slug, false)
  
  if (!eventWithAlbums) {
    notFound()
  }

  const isOwner = session?.user?.id === eventWithAlbums.userId
  const hasEventAccess = session?.user ? await canUserAccessEvent(eventWithAlbums.id, session.user.id) : false

  // Get cached gallery data
  const galleryData = await getCachedGalleryData(eventWithAlbums.id, hasEventAccess)

  // If gallery is not published and user doesn't have access, show not found
  if (!eventWithAlbums.isPublished && !hasEventAccess) {
    notFound()
  }

  // If guest viewing is disabled and user doesn't have access, show not found
  if (!eventWithAlbums.guestCanViewAlbum && !hasEventAccess) {
    notFound()
  }

  return (
    <SlideshowView 
      event={eventWithAlbums as any}
      uploads={galleryData.uploads as any}
      eventSlug={slug}
      slideDuration={(eventWithAlbums as any).slideDuration || 5}
    />
  )
}