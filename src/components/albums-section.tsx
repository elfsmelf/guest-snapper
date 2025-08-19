"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, Lock } from 'lucide-react'
import { CreateAlbumDialog } from './create-album-dialog'
import { UpgradePrompt } from './upgrade-prompt'
import { canCreateAlbum, type EventForFeatureGating } from '@/lib/feature-gates'
import { getPlanFeatures } from '@/lib/pricing'
import type { Currency } from '@/lib/pricing'

interface Album {
  id: string
  name: string
  description?: string | null
  isDefault: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

interface AlbumsSectionProps {
  eventId: string
  initialAlbums: Album[]
  event: {
    id: string
    plan?: string | null
    currency?: Currency
    guestCount?: number
    isPublished?: boolean
  }
}

export function AlbumsSection({ eventId, initialAlbums, event }: AlbumsSectionProps) {
  const [albums, setAlbums] = useState<Album[]>(initialAlbums)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isUpgradePromptOpen, setIsUpgradePromptOpen] = useState(false)
  const [albumLimitError, setAlbumLimitError] = useState<{
    reason: string
    suggestedPlan: any
    currentLimit: number
  } | null>(null)

  const handleAlbumCreated = (newAlbum: Album) => {
    setAlbums(prev => [...prev, newAlbum].sort((a, b) => a.sortOrder - b.sortOrder))
    setAlbumLimitError(null)
  }

  const handleCreateAlbumClick = async () => {
    // Check if user can create another album
    const eventForGating: EventForFeatureGating = {
      id: event.id,
      plan: event.plan,
      guestCount: event.guestCount || 0,
      isPublished: event.isPublished
    }
    
    const albumCheck = canCreateAlbum(eventForGating, albums.length)
    
    if (!albumCheck.allowed) {
      // Show upgrade prompt instead of create dialog
      setAlbumLimitError({
        reason: albumCheck.reason || 'You have reached your album limit',
        suggestedPlan: albumCheck.suggestedPlan,
        currentLimit: albumCheck.currentLimit || 0
      })
      setIsUpgradePromptOpen(true)
    } else {
      setIsCreateDialogOpen(true)
    }
  }

  const handleCreateDialogSubmit = async (albumData: any) => {
    try {
      const response = await fetch(`/api/events/${eventId}/albums`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(albumData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        if (data.requiresUpgrade) {
          // Handle plan limit error from API
          setAlbumLimitError({
            reason: data.error,
            suggestedPlan: data.suggestedPlan,
            currentLimit: data.currentLimit
          })
          setIsCreateDialogOpen(false)
          setIsUpgradePromptOpen(true)
        } else {
          throw new Error(data.error || 'Failed to create album')
        }
        return
      }
      
      handleAlbumCreated(data.album)
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Failed to create album:', error)
      alert('Failed to create album. Please try again.')
    }
  }

  // Get plan info for UI display
  const planFeatures = getPlanFeatures(event.plan || 'free')
  const albumUsage = {
    current: albums.length,
    limit: planFeatures.albumLimit,
    unlimited: planFeatures.albumLimit === 999999
  }

  return (
    <>
      {albums.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {albums.length} album{albums.length !== 1 ? 's' : ''} created
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!albumUsage.unlimited && (
                <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {albumUsage.current}/{albumUsage.limit} albums used
                </div>
              )}
              <Button size="sm" onClick={handleCreateAlbumClick}>
                {albumUsage.current >= albumUsage.limit && !albumUsage.unlimited ? (
                  <><Lock className="mr-2 h-4 w-4" />Upgrade for More</>
                ) : (
                  <><Plus className="mr-2 h-4 w-4" />Create Album</>
                )}
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {albums.map((album) => (
              <div
                key={album.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{album.name}</h4>
                    {album.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  {album.description && (
                    <p className="text-sm text-muted-foreground">
                      {album.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-4">
            No albums created yet. Create albums to organize your photos and videos.
          </p>
          <div className="space-y-4">
            {!albumUsage.unlimited && albumUsage.limit > 0 && (
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">
                  Your {planFeatures.name} includes {albumUsage.limit} album{albumUsage.limit === 1 ? '' : 's'}
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-3">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, (albumUsage.current / albumUsage.limit) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            <Button size="sm" onClick={handleCreateAlbumClick}>
              {albumUsage.current >= albumUsage.limit && !albumUsage.unlimited ? (
                <><Lock className="mr-2 h-4 w-4" />Upgrade for Albums</>
              ) : (
                <><Plus className="mr-2 h-4 w-4" />Create Album</>
              )}
            </Button>
          </div>
        </div>
      )}

      <CreateAlbumDialog
        eventId={eventId}
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateDialogSubmit}
      />
      
      {albumLimitError && (
        <UpgradePrompt
          isOpen={isUpgradePromptOpen}
          onClose={() => {
            setIsUpgradePromptOpen(false)
            setAlbumLimitError(null)
          }}
          eventId={eventId}
          currentPlan={event.plan || 'free'}
          eventCurrency={event.currency}
          reason={albumLimitError.reason}
          suggestedPlan={albumLimitError.suggestedPlan}
          feature="albums"
          actionText="Maybe Later"
        />
      )}
    </>
  )
}