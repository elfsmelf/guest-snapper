"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, Eye, EyeOff, Lock, Info } from 'lucide-react'
import { CreateAlbumDialog } from './create-album-dialog'
import { UpgradePrompt } from './upgrade-prompt'
import { canCreateAlbum, type EventForFeatureGating } from '@/lib/feature-gates'
import { getPlanFeatures } from '@/lib/pricing'
import type { Currency } from '@/lib/pricing'
import { useCreateAlbum, useAlbumsData, albumKeys } from '@/hooks/use-onboarding'
import { useQueryClient } from '@tanstack/react-query'
import { toggleAlbumVisibility } from '@/app/actions/album'
import { toast } from 'sonner'

interface Album {
  id: string
  name: string
  description?: string | null
  isDefault: boolean
  isVisible: boolean
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
  onAlbumsChange?: (albums: Album[]) => void
}

export function AlbumsSection({ eventId, initialAlbums, event, onAlbumsChange }: AlbumsSectionProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isUpgradePromptOpen, setIsUpgradePromptOpen] = useState(false)
  const [albumLimitError, setAlbumLimitError] = useState<{
    reason: string
    suggestedPlan: any
    currentLimit: number
  } | null>(null)
  const [togglingAlbums, setTogglingAlbums] = useState<Set<string>>(new Set())

  // Use TanStack Query for albums data and creation
  const queryClient = useQueryClient()
  const { data: albumsData } = useAlbumsData(eventId)
  const createAlbumMutation = useCreateAlbum(eventId, onAlbumsChange)
  
  // Get albums from TanStack Query, fallback to initialAlbums
  const albums = albumsData?.albums || initialAlbums

  // Note: Parent will be notified via the TanStack Query mutation success callback

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

  const handleCreateDialogSubmit = async (albumData: { name: string; description?: string }) => {
    try {
      await createAlbumMutation.mutateAsync(albumData)
      setIsCreateDialogOpen(false)
      setAlbumLimitError(null)
    } catch (error: any) {
      if (error.requiresUpgrade) {
        // Handle plan limit error
        setAlbumLimitError({
          reason: error.message,
          suggestedPlan: error.suggestedPlan,
          currentLimit: error.currentLimit
        })
        setIsCreateDialogOpen(false)
        setIsUpgradePromptOpen(true)
      } else {
        console.error('Failed to create album:', error)
        // Error toast is handled by the mutation
      }
    }
  }

  const handleToggleVisibility = async (albumId: string) => {
    // Prevent multiple toggles on the same album
    if (togglingAlbums.has(albumId)) return

    setTogglingAlbums(prev => new Set(prev).add(albumId))

    try {
      const result = await toggleAlbumVisibility(albumId)

      if (result.success) {
        toast.success(result.message)
        // Invalidate albums query to trigger refetch and update UI
        queryClient.invalidateQueries({ queryKey: albumKeys.list(eventId) })
      } else {
        toast.error(result.error || 'Failed to toggle album visibility')
      }
    } catch (error) {
      console.error('Failed to toggle album visibility:', error)
      toast.error('Failed to toggle album visibility')
    } finally {
      setTogglingAlbums(prev => {
        const newSet = new Set(prev)
        newSet.delete(albumId)
        return newSet
      })
    }
  }

  // Get plan info for UI display
  const planFeatures = getPlanFeatures(event.plan || 'free_trial')
  const albumUsage = {
    current: albums.length,
    limit: planFeatures.albumLimit,
    unlimited: planFeatures.albumLimit === 999999
  }

  const hasHiddenAlbums = albums.some((album: Album) => album.isVisible === false)

  return (
    <>
      {albums.length > 0 ? (
        <div className="space-y-4">
          {/* Alert for hidden albums */}
          {hasHiddenAlbums && (
            <Alert className="bg-amber-50 border-amber-200">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Some albums are hidden from gallery visitors. Click the eye icon to toggle visibility.
              </AlertDescription>
            </Alert>
          )}
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
            {albums.map((album: Album) => {
              const isToggling = togglingAlbums.has(album.id)
              return (
                <div
                  key={album.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-all ${
                    !album.isVisible ? 'opacity-60 bg-muted/30' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-medium ${!album.isVisible ? 'line-through text-muted-foreground' : ''}`}>
                        {album.name}
                      </h4>
                      {album.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                      {!album.isVisible && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Hidden
                        </Badge>
                      )}
                    </div>
                    {album.description && (
                      <p className={`text-sm text-muted-foreground ${!album.isVisible ? 'line-through' : ''}`}>
                        {album.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleVisibility(album.id)}
                          disabled={isToggling}
                          className={`hover:bg-muted ${!album.isVisible ? 'text-muted-foreground' : ''}`}
                        >
                          {album.isVisible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {album.isVisible
                            ? 'Hide album from gallery visitors'
                            : 'Show album to gallery visitors'
                          }
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )
            })}
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
          currentPlan={event.plan || 'free_trial'}
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