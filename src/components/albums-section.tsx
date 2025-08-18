"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye } from 'lucide-react'
import { CreateAlbumDialog } from './create-album-dialog'

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
}

export function AlbumsSection({ eventId, initialAlbums }: AlbumsSectionProps) {
  const [albums, setAlbums] = useState<Album[]>(initialAlbums)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const handleAlbumCreated = (newAlbum: Album) => {
    setAlbums(prev => [...prev, newAlbum].sort((a, b) => a.sortOrder - b.sortOrder))
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
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Album
            </Button>
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
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Album
          </Button>
        </div>
      )}

      <CreateAlbumDialog
        eventId={eventId}
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onAlbumCreated={handleAlbumCreated}
      />
    </>
  )
}