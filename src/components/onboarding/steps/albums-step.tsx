"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { type OnboardingState } from "@/types/onboarding"
import { updateOnboardingProgress } from "@/app/actions/onboarding"
import { AlbumsSection } from "@/components/albums-section"
import type { Currency } from "@/lib/pricing"
import { useEventData, useAlbumsData } from "@/hooks/use-onboarding"

interface Album {
  id: string
  name: string
  description?: string | null
  isDefault: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

interface AlbumsStepProps {
  eventId: string
  eventSlug: string
  eventName: string
  state: OnboardingState
  onUpdate: (updates: Partial<OnboardingState>) => void
  onComplete: () => Promise<any>
}

export function AlbumsStep({
  eventId,
  eventSlug,
  eventName,
  state,
  onUpdate,
  onComplete
}: AlbumsStepProps) {
  // Use React Query to get data (should be cached from layout prefetching)
  const { data: event } = useEventData(eventId)
  const { data: albumsData } = useAlbumsData(eventId)
  
  // Get albums from React Query, fallback to empty array
  const albums = albumsData?.albums || []

  // Use event data when available, otherwise use basic fallback
  const eventForAlbums = event || {
    id: eventId,
    plan: 'free',
    currency: 'usd' as Currency,
    guestCount: 0,
    isPublished: false
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Create Albums</h3>
        <p className="text-muted-foreground">
          Organize your photos by creating albums (optional but recommended).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5" />
            Photo Albums
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AlbumsSection
            eventId={eventId}
            initialAlbums={albums}
            event={{
              id: eventForAlbums.id,
              plan: eventForAlbums.plan,
              currency: eventForAlbums.currency as Currency,
              guestCount: eventForAlbums.guestCount,
              isPublished: eventForAlbums.isPublished
            }}
            onAlbumsChange={(updatedAlbums) => {
              // Update onboarding progress when albums change
              const albumCount = updatedAlbums.length
              onUpdate({ albumsCreated: albumCount })
            }}
          />
        </CardContent>
      </Card>


      {albums.length === 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            You can always create albums later from your gallery dashboard
          </p>
        </div>
      )}
    </div>
  )
}