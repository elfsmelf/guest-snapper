"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Globe, Calendar as CalendarIcon, Clock, Loader2 } from "lucide-react"
import { format, addMonths } from "date-fns"
import { parseLocalDate, formatLocalDate } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { type OnboardingState } from "@/types/onboarding"
import { updateOnboardingProgress } from "@/app/actions/onboarding"
import { useEventData, eventKeys } from "@/hooks/use-onboarding"

interface PublishStepProps {
  eventId: string
  eventSlug: string
  eventName: string
  state: OnboardingState
  onUpdate: (updates: Partial<OnboardingState>) => void
  onComplete: () => Promise<any>
}

export function PublishStep({
  eventId,
  eventSlug,
  eventName,
  state,
  onUpdate,
  onComplete
}: PublishStepProps) {
  const [isUpdatingDate, setIsUpdatingDate] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const queryClient = useQueryClient()

  // Use React Query to get event data (should be prefetched from layout)
  const { data: event } = useEventData(eventId)

  // Derive activation date directly from event data
  const activationDate = event?.activationDate ? parseLocalDate(event.activationDate) : undefined

  const handleActivationDateChange = async (date: Date | undefined) => {
    if (!date || event?.isPublished) return

    setIsUpdatingDate(true)
    try {
      const response = await fetch(`/api/events/${eventId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activationDate: formatLocalDate(date),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update activation date')
      }

      // Invalidate event data to refresh the UI
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) })
      
      toast.success('Activation date updated')
    } catch (error) {
      console.error('Error updating activation date:', error)
      toast.error('Failed to update activation date')
    } finally {
      setIsUpdatingDate(false)
    }
  }

  const handlePublishEvent = async () => {
    if (!activationDate) {
      toast.error('Please set an activation date first')
      return
    }

    setIsPublishing(true)
    try {
      const response = await fetch(`/api/events/${eventId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublished: true,
          publishedAt: new Date().toISOString(), // This is fine for timestamp
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to publish gallery')
      }

      // Invalidate event data to refresh the UI with new publication status
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) })

      // Update onboarding progress
      await updateOnboardingProgress(eventId, { eventPublished: true })
      onUpdate({ eventPublished: true })

      toast.success('🎉 Gallery published successfully!')
      
      // Complete this step
      await onComplete()
    } catch (error) {
      console.error('Error publishing gallery:', error)
      toast.error('Failed to publish gallery')
    } finally {
      setIsPublishing(false)
    }
  }

  const getUploadEndDate = () => {
    return activationDate ? addMonths(activationDate, 3) : null
  }

  const getDownloadEndDate = () => {
    return activationDate ? addMonths(activationDate, 12) : null
  }


  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Publish Your Gallery</h3>
        <p className="text-muted-foreground">
          Set when you want your gallery to go live for guests to access. This can be different from your event date.
        </p>
      </div>

      {/* Activation Date */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Gallery Activation Date
            {event?.isPublished && <span className="text-xs text-muted-foreground ml-1">(locked)</span>}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !activationDate && "text-muted-foreground"
                )}
                disabled={event?.isPublished || isUpdatingDate}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {activationDate ? format(activationDate, "EEEE, MMMM do, yyyy") : "When should guests be able to access?"}
                {isUpdatingDate && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={activationDate}
                onSelect={handleActivationDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              When your gallery becomes publicly accessible to guests.
              {event?.isPublished && " (Cannot be changed after publishing)"}
            </p>
          </div>
        </div>

        {/* Publish Button */}
        {!event?.isPublished && (
          <Button 
            onClick={handlePublishEvent}
            disabled={!activationDate || isPublishing}
            className="w-full"
            size="lg"
          >
            {isPublishing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish Gallery'
            )}
          </Button>
        )}

        {/* Success message for published galleries */}
        {event?.isPublished && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <div className="font-medium text-green-900 dark:text-green-100 mb-1">🎉 Your gallery is live!</div>
            <p className="text-sm text-green-700 dark:text-green-300">Your gallery is now publicly accessible to all guests.</p>
            {event?.publishedAt && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                Published on {new Date(event.publishedAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </div>
            )}
          </div>
        )}

        {/* Duration Display */}
        {activationDate && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Gallery Windows</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm font-medium mb-1">Upload Window</div>
                  <div className="text-xs text-muted-foreground">
                    {format(activationDate, "MMM d, yyyy")} - {getUploadEndDate() ? format(getUploadEndDate()!, "MMM d, yyyy") : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">3 months duration</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm font-medium mb-1">Download Window</div>
                  <div className="text-xs text-muted-foreground">
                    {format(activationDate, "MMM d, yyyy")} - {getDownloadEndDate() ? format(getDownloadEndDate()!, "MMM d, yyyy") : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">12 months duration</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}