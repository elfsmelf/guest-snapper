"use client"

import { Calendar, Eye, Users, Lock, Shield, ChevronRight, Globe, Clock, Loader2 } from "lucide-react"
import { useState, useCallback } from "react"
import { format, addMonths } from "date-fns"

import { cn } from "@/lib/utils"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GuestCountPricingDialog } from "./guest-count-pricing-dialog"
import { CoverImageUpload } from "./cover-image-upload"
import { UpgradePrompt } from "./upgrade-prompt"
import { canPublishEvent } from "@/lib/feature-gates"
import { toast } from "sonner"

interface Event {
  id: string
  eventDate: string
  activationDate?: string | null
  isPublished: boolean
  publishedAt?: string | null
  guestCanViewAlbum: boolean
  approveUploads: boolean
  revealSetting: string
  themeId: string
  guestCount: number
  settings?: string
  coverImageUrl?: string | null
  name: string
  // Payment fields
  plan?: string
  currency?: string
  paidAt?: string | null
  stripeSessionId?: string | null
  stripePaymentIntent?: string | null
}

interface EventSettingsFormProps {
  event: Event
  calculatedGuestCount: number
}

export function EventSettingsForm({ event, calculatedGuestCount }: EventSettingsFormProps) {
  const [date, setDate] = useState<Date>(new Date(event.eventDate))
  const [activationDate, setActivationDate] = useState<Date | undefined>(
    event.activationDate ? new Date(event.activationDate) : undefined
  )
  const [guestCanView, setGuestCanView] = useState(event.guestCanViewAlbum)
  const [autoApprove, setAutoApprove] = useState(event.approveUploads)
  const [guestCountDialogOpen, setGuestCountDialogOpen] = useState(false)
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false)
  const [publishError, setPublishError] = useState<{
    reason: string
    suggestedPlan: any
  } | null>(null)
  const [currentGuestCount, setCurrentGuestCount] = useState(event.guestCount || calculatedGuestCount)
  const [isUpdating, setIsUpdating] = useState(false)

  const updateEventSettings = useCallback(async (updates: any) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/events/${event.id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      const result = await response.json()
      console.log('Settings updated successfully:', result)
    } catch (error) {
      console.error('Failed to update settings:', error)
      toast.error('Failed to update settings')
    } finally {
      setIsUpdating(false)
    }
  }, [event.id])

  const handleDateChange = useCallback(async (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate)
      await updateEventSettings({
        eventDate: newDate.toISOString(),
      })
    }
  }, [updateEventSettings])

  const handleActivationDateChange = useCallback(async (newDate: Date | undefined) => {
    setActivationDate(newDate)
    await updateEventSettings({
      activationDate: newDate ? newDate.toISOString() : null,
    })
  }, [updateEventSettings])

  const handleGuestViewChange = useCallback(async (checked: boolean) => {
    setGuestCanView(checked)
    await updateEventSettings({
      guestCanViewAlbum: checked,
    })
  }, [updateEventSettings])

  const handleAutoApproveChange = useCallback(async (checked: boolean) => {
    setAutoApprove(checked)
    await updateEventSettings({
      approveUploads: checked,
    })
  }, [updateEventSettings])

  const handleGuestCountChange = useCallback(async (newCount: number) => {
    setCurrentGuestCount(newCount)
    setGuestCountDialogOpen(false)
    await updateEventSettings({
      guestCount: newCount,
    })
  }, [updateEventSettings])

  const handlePublishEvent = useCallback(async () => {
    if (!activationDate) {
      toast.error('Please set an activation date before publishing')
      return
    }

    // Client-side check first for better UX
    const publishCheck = canPublishEvent({
      id: event.id,
      plan: event.plan,
      guestCount: event.guestCount || 0,
      isPublished: event.isPublished
    })

    if (!publishCheck.allowed && publishCheck.upgradeRequired) {
      setPublishError({
        reason: publishCheck.reason || 'Cannot publish with current plan',
        suggestedPlan: publishCheck.suggestedPlan
      })
      setUpgradePromptOpen(true)
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/events/${event.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.requiresUpgrade) {
          setPublishError({
            reason: errorData.error,
            suggestedPlan: errorData.suggestedPlan
          })
          setUpgradePromptOpen(true)
          return
        }
        throw new Error(errorData.error || 'Failed to publish event')
      }

      const result = await response.json()
      toast.success('Event published successfully!')
      
      // Refresh the page to show updated state
      window.location.reload()
    } catch (error: any) {
      console.error('Failed to publish event:', error)
      toast.error(error.message || 'Failed to publish event')
    } finally {
      setIsUpdating(false)
    }
  }, [activationDate, event.id, event.plan, event.guestCount, event.isPublished])

  // Map current guest count to valid pricing tier
  const getValidGuestCount = (count: number) => {
    if (count <= 8) return 8
    if (count <= 10) return 10
    if (count <= 25) return 25
    if (count <= 50) return 50
    if (count <= 100) return 100
    if (count <= 200) return 200
    return 999999 // unlimited
  }

  // Calculate upload and download durations based on activation date
  const getUploadEndDate = () => {
    if (!activationDate) return null
    return addMonths(activationDate, 3) // 3 months for upload
  }

  const getDownloadEndDate = () => {
    if (!activationDate) return null
    return addMonths(activationDate, 12) // 12 months for download
  }

  return (
    <div className="space-y-6">
      {/* Cover Image Upload - Outside Card */}
      <CoverImageUpload event={event} />

      {/* Event Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date of Event */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date of Event</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={isUpdating}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? format(date, "EEEE, MMMM do, yyyy") : "Pick a date"}
                  {isUpdating && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Guest Count */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Number of Guests</label>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              onClick={() => setGuestCountDialogOpen(true)}
              disabled={isUpdating}
            >
              <Users className="mr-2 h-4 w-4" />
{currentGuestCount === 8 ? "FREE" : currentGuestCount >= 999999 ? "Unlimited" : currentGuestCount} guests
              <ChevronRight className="ml-auto h-4 w-4" />
              {isUpdating && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            </Button>
            {/* Free Trial Notice */}
            {currentGuestCount === 8 && (
              <div className="text-center text-sm text-muted-foreground bg-orange-50 border border-orange-200 rounded-lg p-3">
                Change the amount of guests to make your gallery public
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Moderation Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Moderation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Guest can view album */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Guest can view album</div>
              <div className="text-xs text-muted-foreground">
                Allow guests to view photos and videos in the gallery
              </div>
            </div>
            <Switch 
              checked={guestCanView}
              onCheckedChange={handleGuestViewChange}
              className="data-[state=checked]:bg-primary"
              disabled={isUpdating}
            />
          </div>

          {/* Approve Uploads */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Approve uploads</div>
              <div className="text-xs text-muted-foreground">
                Manually review and approve photos before they appear in the gallery
              </div>
            </div>
            <Switch 
              checked={autoApprove}
              onCheckedChange={handleAutoApproveChange}
              className="data-[state=checked]:bg-primary"
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card>

      {/* Publication Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Publication Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Gallery Status</div>
              <div className="text-xs text-muted-foreground">
                {event.isPublished ? 'Your gallery is live and accessible to guests' : 'Your gallery is private and only visible to you'}
              </div>
            </div>
            <Badge 
              variant={event.isPublished ? 'default' : 'destructive'}
              className={cn(
                event.isPublished 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200 font-semibold'
              )}
            >
              {event.isPublished ? 'Published' : 'Private'}
            </Badge>
          </div>

          {event.publishedAt && (
            <div className="text-xs text-muted-foreground">
              Published on {format(new Date(event.publishedAt), "MMMM d, yyyy 'at' h:mm a")}
            </div>
          )}

          {/* Activation Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Activation Date
              {event.isPublished && <span className="text-xs text-muted-foreground ml-1">(locked)</span>}
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !activationDate && "text-muted-foreground"
                  )}
                  disabled={event.isPublished || isUpdating}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {activationDate ? format(activationDate, "EEEE, MMMM do, yyyy") : "Set activation date"}
                  {isUpdating && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={activationDate}
                  onSelect={handleActivationDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              When your gallery becomes publicly accessible to guests
              {event.isPublished && " (Cannot be changed after publishing)"}
            </p>
          </div>

          {/* Publish Button */}
          {!event.isPublished && (
            <div className="pt-4 border-t">
              <Button 
                onClick={handlePublishEvent}
                disabled={!activationDate || isUpdating}
                className="w-full"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  'Publish Gallery'
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Once published, the activation date cannot be changed
              </p>
            </div>
          )}

          {/* Gallery Setup Information */}
          <div className={cn(
            "p-4 rounded-lg border",
            event.isPublished 
              ? "bg-green-50 border-green-200" 
              : "bg-pink-50 border-pink-200"
          )}>
            <div className={cn(
              "text-sm",
              event.isPublished ? "text-green-900" : "text-pink-900"
            )}>
              {event.isPublished ? (
                <div>
                  <div className="font-medium mb-1">🎉 Your gallery is live!</div>
                  <p>Your gallery is now publicly accessible to all guests. The activation date is locked and cannot be changed.</p>
                </div>
              ) : (
                <div>
                  <div className="font-medium mb-1">📝 Gallery Setup</div>
                  <p>Your gallery is currently private and only visible to you as the owner. Once you set an activation date and publish your gallery, it will become accessible to all guests. Please note that after publishing, you won't be able to modify the activation date, so make sure you're happy with your chosen date before proceeding.</p>
                </div>
              )}
            </div>
          </div>

          {/* Duration Display */}
          {activationDate && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Gallery Windows</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-pink-50 border border-pink-200">
                  <div className="text-sm font-medium text-pink-900 mb-1">Upload Window</div>
                  <div className="text-xs text-pink-700">
                    {format(activationDate, "MMM d, yyyy")} - {getUploadEndDate() ? format(getUploadEndDate()!, "MMM d, yyyy") : "N/A"}
                  </div>
                  <div className="text-xs text-pink-600 mt-1">3 months duration</div>
                </div>
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                  <div className="text-sm font-medium text-rose-900 mb-1">Download Window</div>
                  <div className="text-xs text-rose-700">
                    {format(activationDate, "MMM d, yyyy")} - {getDownloadEndDate() ? format(getDownloadEndDate()!, "MMM d, yyyy") : "N/A"}
                  </div>
                  <div className="text-xs text-rose-600 mt-1">12 months duration</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guest Count Pricing Dialog */}
      <GuestCountPricingDialog
        isOpen={guestCountDialogOpen}
        onClose={() => setGuestCountDialogOpen(false)}
        eventId={event.id}
        currentPlan={event.plan || 'free'}
        eventCurrency={(event.currency as any) || 'AUD'}
        paymentSuccess={false}
        paymentData={undefined}
      />
      
      {/* Publish Upgrade Prompt */}
      {publishError && (
        <UpgradePrompt
          isOpen={upgradePromptOpen}
          onClose={() => {
            setUpgradePromptOpen(false)
            setPublishError(null)
          }}
          eventId={event.id}
          currentPlan={event.plan || 'free'}
          eventCurrency={(event.currency as any) || 'AUD'}
          reason={publishError.reason}
          suggestedPlan={publishError.suggestedPlan}
          feature="publishing"
          actionText="Maybe Later"
        />
      )}
    </div>
  )
}