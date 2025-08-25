import { notFound } from 'next/navigation'
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import Image from "next/image"
import { canUserAccessEvent } from "@/lib/auth-helpers"
import { getCachedEventData } from "@/lib/gallery-cache"
import { WaveformVoiceRecorder } from "@/components/gallery/waveform-voice-recorder"

interface VoicePageProps {
  params: Promise<{ slug: string }>
}

export default async function VoicePage({ params }: VoicePageProps) {
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

  const uploadWindowOpen = eventWithAlbums.activationDate ? 
    new Date() >= new Date(eventWithAlbums.activationDate) : true

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Cover Image Header with Nav Overlay */}
    {eventWithAlbums.coverImageUrl && (
      <div className="relative h-32 md:h-40 overflow-hidden">
        <Image
          src={eventWithAlbums.coverImageUrl}
          alt={`${eventWithAlbums.coupleNames} - ${eventWithAlbums.name}`}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-xl md:text-2xl font-bold mb-1">
              Record Voice Message
            </h1>
            <p className="text-sm md:text-base opacity-90">
              {eventWithAlbums.coupleNames} • {eventWithAlbums.name}
            </p>
          </div>
        </div>
      </div>
    )}
    
    {/* Owner badge - more compact */}
    {isOwner && (
      <div className="bg-secondary border-b border-border">
        <div className="container mx-auto px-4 py-2">
          <p className="text-xs text-secondary-foreground flex items-center justify-center gap-1">
            <span className="text-primary">👑</span>
            <strong>Owner</strong> - Record anytime
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
  )
}