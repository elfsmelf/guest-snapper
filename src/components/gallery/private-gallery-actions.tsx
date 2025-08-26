"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, MessageSquare, Mic } from "lucide-react"
import { MessageDialog } from "./message-dialog"

interface PrivateGalleryActionsProps {
  eventId: string
  eventName: string
  eventSlug: string
  variant?: "hero" | "card"
  className?: string
}

export function PrivateGalleryActions({ 
  eventId, 
  eventName, 
  eventSlug, 
  variant = "hero",
  className = ""
}: PrivateGalleryActionsProps) {
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)

  if (variant === "hero") {
    return (
      <div className={`flex flex-col gap-3 w-full max-w-xs ${className}`}>
        <Button 
          asChild 
          size="lg"
          className="bg-primary/90 backdrop-blur-sm text-primary-foreground hover:bg-primary transition-all duration-300 h-14 text-base font-medium rounded-lg shadow-xl border border-white/20"
        >
          <a href={`/gallery/${eventSlug}/upload`}>
            <Camera className="w-5 h-5 mr-2" />
            Upload Media
          </a>
        </Button>

        <Button
          asChild
          size="lg"
          className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-300 h-14 text-base font-medium rounded-lg shadow-xl"
        >
          <a href={`/gallery/${eventSlug}/voice`}>
            <Mic className="w-5 h-5 mr-2" />
            Leave a Voicemail
          </a>
        </Button>

        <Button
          onClick={() => setIsMessageDialogOpen(true)}
          size="lg"
          className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-300 h-14 text-base font-medium rounded-lg shadow-xl"
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          Leave a Message
        </Button>

        <MessageDialog
          eventId={eventId}
          eventName={eventName}
          isOpen={isMessageDialogOpen}
          onClose={() => setIsMessageDialogOpen(false)}
        />
      </div>
    )
  }

  if (variant === "card") {
    return (
      <div className={`space-y-4 ${className}`}>
        <Button 
          asChild 
          size="lg"
          className="w-full h-16 text-lg font-semibold"
        >
          <a href={`/gallery/${eventSlug}/upload`}>
            <Camera className="w-6 h-6 mr-3" />
            Upload Your Photos & Videos
          </a>
        </Button>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button 
            asChild
            variant="outline"
            size="lg"
            className="h-14 text-base font-medium"
          >
            <a href={`/gallery/${eventSlug}/voice`}>
              <Mic className="w-5 h-5 mr-2" />
              Leave Voicemail
            </a>
          </Button>
          
          <Button
            onClick={() => setIsMessageDialogOpen(true)}
            variant="outline"
            size="lg"
            className="h-14 text-base font-medium"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Leave a Message
          </Button>
        </div>

        <MessageDialog
          eventId={eventId}
          eventName={eventName}
          isOpen={isMessageDialogOpen}
          onClose={() => setIsMessageDialogOpen(false)}
        />
      </div>
    )
  }

  return null
}