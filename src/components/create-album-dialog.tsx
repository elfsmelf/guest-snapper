"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface CreateAlbumDialogProps {
  eventId: string
  isOpen: boolean
  onClose: () => void
  onSubmit?: (albumData: { name: string; description?: string }) => Promise<void>
  onAlbumCreated?: (album: any) => void // Keep for backward compatibility
}

export function CreateAlbumDialog({ eventId, isOpen, onClose, onSubmit, onAlbumCreated }: CreateAlbumDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Album name is required')
      return
    }

    const albumData = {
      name: name.trim(),
      description: description.trim() || undefined,
    }

    setIsCreating(true)
    try {
      if (onSubmit) {
        // Use new onSubmit prop for better error handling
        await onSubmit(albumData)
        // Reset form and close dialog
        setName('')
        setDescription('')
        onClose()
      } else if (onAlbumCreated) {
        // Fallback to old behavior for backward compatibility
        const response = await fetch(`/api/events/${eventId}/albums`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(albumData),
        })

        if (!response.ok) {
          throw new Error('Failed to create album')
        }

        const result = await response.json()
        toast.success('Album created successfully!')
        onAlbumCreated(result.album)
        
        // Reset form and close dialog
        setName('')
        setDescription('')
        onClose()
      }
    } catch (error) {
      console.error('Failed to create album:', error)
      toast.error('Failed to create album')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      setName('')
      setDescription('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Album
            </DialogTitle>
            <DialogDescription>
              Create a new album to organize photos and videos from your event.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="album-name">Album Name *</Label>
              <Input
                id="album-name"
                placeholder="e.g., Ceremony, Reception, Dancing..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isCreating}
                maxLength={100}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="album-description">Description (Optional)</Label>
              <Textarea
                id="album-description"
                placeholder="Add a description for this album..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isCreating}
                maxLength={500}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Album
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}