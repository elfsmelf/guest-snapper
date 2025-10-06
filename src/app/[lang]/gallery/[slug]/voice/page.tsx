import { notFound, redirect } from 'next/navigation'
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import Image from "next/image"
import { canUserAccessEvent } from "@/lib/auth-helpers"
import { getCachedEventData } from "@/lib/gallery-cache"
import { WaveformVoiceRecorder } from "@/components/gallery/waveform-voice-recorder"
import { GalleryPageWrapper } from "@/components/gallery/gallery-page-wrapper"
import { parseLocalDate } from "@/lib/date-utils"

interface VoicePageProps {
  params: Promise<{ lang: string; slug: string }>
}

export default async function VoicePage({ params }: VoicePageProps) {
  const { lang, slug } = await params

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

  // Check if activation date has passed
  const isActivationDatePassed = eventWithAlbums.activationDate
    ? parseLocalDate(eventWithAlbums.activationDate) <= new Date()
    : true // If no activation date, consider it as passed

  // Redirect to gallery page if gallery is not published OR activation date hasn't passed, and user is not the owner
  if ((!eventWithAlbums.isPublished || !isActivationDatePassed) && !isOwner) {
    redirect(`/${lang}/gallery/${slug}`)
  }

  const uploadWindowOpen = eventWithAlbums.activationDate ?
    new Date() >= new Date(eventWithAlbums.activationDate) : true

  return (
    <GalleryPageWrapper eventData={eventWithAlbums} eventSlug={slug}>
      <div className="min-h-screen bg-background">
        {/* Owner badge */}
        {isOwner && (
          <div className="bg-secondary border-b border-border">
            <div className="container mx-auto px-4 py-2">
              <p className="text-sm text-secondary-foreground flex items-center justify-center gap-2">
                <span className="text-primary">👑</span>
                <strong>Gallery Owner:</strong> You can record anytime
              </p>
            </div>
          </div>
        )}

        <WaveformVoiceRecorder
          event={{
            id: eventWithAlbums.id,
            name: eventWithAlbums.name,
            coupleNames: eventWithAlbums.coupleNames,
            slug: eventWithAlbums.slug,
            uploadWindowEnd: eventWithAlbums.activationDate || ''
          }}
          uploadWindowOpen={uploadWindowOpen}
          isOwner={isOwner}
          guestCanUpload={eventWithAlbums.guestCanViewAlbum ?? false}
        />
      </div>
    </GalleryPageWrapper>
  )
}