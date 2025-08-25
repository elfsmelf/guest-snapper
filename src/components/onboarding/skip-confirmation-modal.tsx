"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowRight, Clock, X } from "lucide-react"
import { skipOnboarding } from "@/app/actions/onboarding"
import { toast } from "sonner"

interface SkipConfirmationModalProps {
  open: boolean
  onClose: () => void
  eventId: string
  eventSlug: string
}

export function SkipConfirmationModal({
  open,
  onClose,
  eventId,
  eventSlug
}: SkipConfirmationModalProps) {
  const router = useRouter()
  const [isSkipping, setIsSkipping] = useState(false)

  const handleSkipForNow = async () => {
    setIsSkipping(true)
    try {
      const result = await skipOnboarding(eventId, false) // Can resume later
      if (result.success) {
        toast.info("Setup wizard paused. You can resume anytime from your dashboard.")
        router.push('/dashboard')
      } else {
        toast.error(result.error || "Failed to skip onboarding")
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsSkipping(false)
    }
  }

  const handleSkipPermanently = async () => {
    setIsSkipping(true)
    try {
      const result = await skipOnboarding(eventId, true) // Marked as complete
      if (result.success) {
        toast.success("You can complete these steps later from your event settings.")
        router.push(`/dashboard/events/${eventId}`)
      } else {
        toast.error(result.error || "Failed to skip onboarding")
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsSkipping(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <DialogTitle>Skip Setup Wizard?</DialogTitle>
          </div>
          <DialogDescription className="space-y-2 pt-3">
            <p>The setup wizard helps you configure important features for your gallery:</p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>Upload a cover photo</li>
              <li>Configure privacy settings</li>
              <li>Choose a theme</li>
              <li>Set up payment (if needed)</li>
              <li>Publish your gallery</li>
            </ul>
            <p className="pt-2">You can always complete these steps later, but your gallery may not be fully functional until setup is complete.</p>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={onClose}
            className="w-full"
            disabled={isSkipping}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Continue Setup
          </Button>
          
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleSkipForNow}
              disabled={isSkipping}
              className="flex-1"
            >
              <Clock className="mr-2 h-4 w-4" />
              Pause for Now
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleSkipPermanently}
              disabled={isSkipping}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Skip Completely
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}