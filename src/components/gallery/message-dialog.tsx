"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageSquare, Send } from "lucide-react"

interface MessageDialogProps {
  eventId: string
  eventName: string
  isOpen: boolean
  onClose: () => void
  onMessageAdded?: (guestName: string, message: string) => void
}

export function MessageDialog({ eventId, eventName, isOpen, onClose, onMessageAdded }: MessageDialogProps) {
  const [guestName, setGuestName] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!guestName.trim() || !message.trim()) return

    const trimmedName = guestName.trim()
    const trimmedMessage = message.trim()

    // Optimistically update UI first - pass data to parent for optimistic update
    onMessageAdded?.(trimmedName, trimmedMessage)

    // Reset form and close dialog immediately for better UX
    setGuestName("")
    setMessage("")
    onClose()
    
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/guestbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          guestName: trimmedName,
          message: trimmedMessage,
        }),
      })

      if (response.ok) {
        console.log('Message sent successfully!')
      } else {
        console.error('Failed to send message')
        // TODO: Handle failure - maybe revert optimistic update
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // TODO: Handle failure - maybe revert optimistic update
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Leave a Message
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="guest-name">Your Name</Label>
            <Input
              id="guest-name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter your name"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Leave a message for ${eventName}...`}
              rows={4}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !guestName.trim() || !message.trim()}
            >
              {isSubmitting ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}