import { notFound } from 'next/navigation'
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
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

  const uploadWindowOpen = new Date(eventWithAlbums.uploadWindowEnd) > new Date()

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
              <strong>{isOwner ? 'Gallery Owner:' : 'Organization Member:'}</strong> You can record voice messages even when the upload window is closed.
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
          uploadWindowEnd: eventWithAlbums.uploadWindowEnd
        }}
        uploadWindowOpen={uploadWindowOpen}
        isOwner={isOwner}
      />
    </div>
  )
}