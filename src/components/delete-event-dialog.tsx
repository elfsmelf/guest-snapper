"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, AlertTriangle } from "lucide-react"
import { deleteEvent } from "@/app/actions/delete-event"
import { toast } from "sonner"
import { useEffect } from "react"

interface DeleteEventDialogProps {
  eventId: string
  eventName: string
  coupleNames: string
  uploadsCount?: number
}

export function DeleteEventDialog({ 
  eventId, 
  eventName, 
  coupleNames, 
  uploadsCount = 0 
}: DeleteEventDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmationText, setConfirmationText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [actualUploadsCount, setActualUploadsCount] = useState(uploadsCount)
  const router = useRouter()

  const expectedText = "DELETE"
  const canDelete = confirmationText === expectedText

  const handleDelete = async () => {
    if (!canDelete) return

    setIsDeleting(true)
    
    try {
      const result = await deleteEvent(eventId)
      
      if (result.success) {
        toast.success('Event deleted successfully')
        // Navigate to dashboard after a brief delay
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 500)
      } else {
        toast.error(result.error || 'Failed to delete event')
        setIsDeleting(false)
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete event')
      setIsDeleting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!isDeleting) {
      setIsOpen(open)
      if (!open) {
        setConfirmationText("")
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="w-full">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Event
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              This will permanently delete <strong>"{eventName}"</strong> for{" "}
              <strong>{coupleNames}</strong> and all associated data.
            </p>
            <p className="text-sm">
              This includes:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
              <li>{actualUploadsCount} photos and videos</li>
              <li>All audio messages</li>
              <li>All guestbook entries</li>
              <li>All albums and organization</li>
              <li>All collaborator access</li>
              <li>All files from cloud storage</li>
            </ul>
            <p className="text-sm font-semibold text-destructive">
              This action cannot be undone.
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <strong>DELETE</strong> to confirm:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Type DELETE to confirm"
              disabled={isDeleting}
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Forever
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}