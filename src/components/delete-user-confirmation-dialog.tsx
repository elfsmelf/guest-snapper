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
import {
  AlertTriangle,
  Loader2,
  User,
  Calendar,
  FileImage,
  Folder,
  MessageSquare,
  Database,
  HardDrive
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import type { DeletionPreview } from '@/lib/user-deletion-service'

interface DeleteUserConfirmationDialogProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onDeleted: () => void
}

export function DeleteUserConfirmationDialog({ 
  userId, 
  isOpen, 
  onClose, 
  onDeleted 
}: DeleteUserConfirmationDialogProps) {
  const [preview, setPreview] = useState<DeletionPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load preview data when dialog opens
  const loadPreview = async () => {
    if (!isOpen || preview) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}/deletion-preview`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load deletion preview')
      }
      
      const data = await response.json()
      setPreview(data.preview)
    } catch (err: any) {
      setError(err.message)
      console.error('Failed to load deletion preview:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle the actual deletion
  const handleDelete = async () => {
    if (!preview) return

    setDeleting(true)

    try {
      const response = await fetch(`/api/admin/users/${userId}/delete-robust`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmed: true }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }
      
      const result = await response.json()
      
      // Clear auth state for the deleted user to prevent "unable_to_create_user" errors
      try {
        await fetch('/api/auth/clear-session', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: preview.user.email })
        })
        console.log('✅ Auth state cleared for deleted user')
      } catch (sessionError) {
        console.warn('⚠️ Could not clear auth state:', sessionError)
        // Don't fail the deletion if clearing fails
      }

      // Also clear browser storage that might cache user data
      try {
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
          console.log('✅ Browser storage cleared')
        }
      } catch (storageError) {
        console.warn('⚠️ Could not clear browser storage:', storageError)
      }
      
      toast.success(`User ${preview.user.email} has been permanently deleted`, {
        description: `Deleted ${result.result.summary.eventsDeleted} events, ${result.result.summary.uploadsDeleted} files, and all associated data.`
      })
      
      onDeleted()
      handleClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user')
      console.error('Delete error:', err)
    } finally {
      setDeleting(false)
    }
  }

  const handleClose = () => {
    if (!deleting) {
      setPreview(null)
      setError(null)
      onClose()
    }
  }

  // Load preview when dialog opens
  if (isOpen && !loading && !preview && !error) {
    loadPreview()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Confirm User Deletion
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please review what will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading deletion preview...</span>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive font-medium">Error loading preview</p>
              <p className="text-destructive/80 text-sm mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadPreview} 
                className="mt-2"
                disabled={loading}
              >
                Try Again
              </Button>
            </div>
          )}

          {preview && (
            <>
              {/* User Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <User className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">{preview.user.name}</h3>
                    <p className="text-sm text-muted-foreground">{preview.user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Member since {formatDate(preview.user.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Deletion Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Events</span>
                    </div>
                    <Badge variant="secondary">{preview.events.count}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileImage className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Media Files</span>
                    </div>
                    <Badge variant="secondary">{preview.uploads.count}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">Albums</span>
                    </div>
                    <Badge variant="secondary">{preview.albums.count}</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium">Guestbook</span>
                    </div>
                    <Badge variant="secondary">{preview.guestbookEntries.count}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium">Sessions</span>
                    </div>
                    <Badge variant="secondary">{preview.betterAuthData.sessions}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium">Storage</span>
                    </div>
                    <Badge variant="secondary">{formatFileSize(preview.uploads.totalSizeBytes)}</Badge>
                  </div>
                </div>
              </div>

              {/* Event Details */}
              {preview.events.count > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">Events to be deleted:</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {preview.events.list.map((event) => (
                        <div key={event.id} className="flex items-center justify-between text-sm bg-muted/30 rounded p-2">
                          <div>
                            <span className="font-medium">{event.name}</span>
                            <span className="text-muted-foreground ml-2">({event.coupleNames})</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(event.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Warning */}
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">⚠️ This action is irreversible</p>
                    <ul className="text-sm text-destructive/80 mt-2 space-y-1">
                      <li>• All user data will be permanently deleted</li>
                      <li>• Media files will be removed from cloud storage</li>
                      <li>• User will be immediately logged out of all devices</li>
                      <li>• Event guests will no longer be able to access galleries</li>
                      <li>• If user recreates account and gets errors, they should clear browser data or use incognito mode</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={!preview || deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Permanently Delete User'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}