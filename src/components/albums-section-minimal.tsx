"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, EyeOff } from 'lucide-react'

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
    currency?: any
    guestCount?: number
    isPublished?: boolean
  }
  onAlbumsChange?: (albums: Album[]) => void
}

export function AlbumsSection({ eventId, initialAlbums, event, onAlbumsChange }: AlbumsSectionProps) {
  const [albums] = useState(initialAlbums)

  const handleToggleVisibility = (albumId: string) => {
    console.log('Toggle visibility for album:', albumId)
  }

  const hasHiddenAlbums = albums.some(album => album.isVisible === false)

  return (
    <>
      {albums.length > 0 ? (
        <div className="space-y-4">
          {/* Simple alert for hidden albums */}
          {hasHiddenAlbums && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                Some albums are hidden from gallery visitors. Click the eye icon to toggle visibility.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {albums.length} album{albums.length !== 1 ? 's' : ''} created
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Album
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {albums.map((album) => (
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleVisibility(album.id)}
                    className={`hover:bg-muted ${!album.isVisible ? 'text-muted-foreground' : ''}`}
                    title={album.isVisible ? 'Hide album from gallery visitors' : 'Show album to gallery visitors'}
                  >
                    {album.isVisible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
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
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Album
          </Button>
        </div>
      )}
    </>
  )
}