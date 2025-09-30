"use client"

import { Calendar, Eye, Users, Lock, Shield, ChevronRight, Globe, Clock, Loader2, Heart } from "lucide-react"
import { useState, useCallback } from "react"
import { format, addMonths } from "date-fns"
import { parseLocalDate, formatLocalDate } from "@/lib/date-utils"

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
import { PricingCards } from "./pricing-cards"
import { UpgradePrompt } from "./upgrade-prompt"
import { canPublishEvent } from "@/lib/feature-gates"
import { planFeatures, type Currency, type Plan } from "@/lib/pricing"
import { toast } from "sonner"
import { getTrialStatus, formatTrialStatus } from "@/lib/trial-utils"

interface Event {
  id: string
  eventDate: string
  activationDate?: string | null
  isPublished: boolean
  publishedAt?: string | null
  guestCanViewAlbum: boolean
  guestCanViewGuestbook: boolean
  guestCanViewAudioMessages: boolean
  approveUploads: boolean
  revealSetting: string
  themeId: string
  guestCount: number
  settings?: string
  coverImageUrl?: string | null
  name: string
  privacySettings?: string
  // Payment fields
  plan?: string
  currency?: string
  paidAt?: string | null
  stripeSessionId?: string | null
  stripePaymentIntent?: string | null
  // Trial tracking
  createdAt?: string
}

interface EventSettingsFormProps {
  event: Event
  calculatedGuestCount: number
}

export function EventSettingsForm({ event, calculatedGuestCount }: EventSettingsFormProps) {
  const [date, setDate] = useState<Date>(parseLocalDate(event.eventDate))
  const [activationDate, setActivationDate] = useState<Date | undefined>(
    event.activationDate ? parseLocalDate(event.activationDate) : undefined
  )
  const [guestCanView, setGuestCanView] = useState(event.guestCanViewAlbum)
  const [guestCanViewGuestbook, setGuestCanViewGuestbook] = useState(event.guestCanViewGuestbook)
  const [guestCanViewAudioMessages, setGuestCanViewAudioMessages] = useState(event.guestCanViewAudioMessages)
  const [autoApprove, setAutoApprove] = useState(event.approveUploads)

  // Parse privacy settings to get guest downloads setting
  const getPrivacySettings = () => {
    try {
      return event.privacySettings ? JSON.parse(event.privacySettings) : {}
    } catch {
      return {}
    }
  }

  const [guestCanDownload, setGuestCanDownload] = useState<boolean>(() => {
    const privacySettings = getPrivacySettings()
    return privacySettings.allow_guest_downloads ?? false // Default to false
  })
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>((event.currency as Currency) || 'USD')
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false)
  const [isSelectingPlan, setIsSelectingPlan] = useState(false)

  // Get trial status using utility function
  const trialStatus = getTrialStatus({
    plan: event.plan,
    createdAt: event.createdAt || new Date().toISOString(),
    paidAt: event.paidAt
  })

  // Backward compatibility with old code
  const getTrialDaysRemaining = () => trialStatus.daysRemaining

  const trialDaysRemaining = getTrialDaysRemaining()

  const [publishError, setPublishError] = useState<{
    reason: string
    suggestedPlan: any
  } | null>(null)
  // Calculate guest count based on plan if database value seems outdated
  const getGuestCountFromPlan = (plan: string) => {
    switch (plan) {
      case 'guest50': return 50 // legacy
      case 'guest100': return 100 // legacy
      case 'unlimited': return 999999 // legacy
      case 'bliss': return 999999 // unlimited guests
      case 'radiance': return 999999 // unlimited guests
      case 'eternal': return 999999 // unlimited guests
      case 'free_trial': return 999999 // unlimited guests during trial
      default: return 999999 // default to unlimited
    }
  }

  // Use plan-based guest count if database value is inconsistent with plan
  const planBasedGuestCount = getGuestCountFromPlan(event.plan || 'free_trial')
  const databaseGuestCount = event.guestCount || calculatedGuestCount

  // If database shows old values (8 or inconsistent with plan), use plan-based count
  const intelligentGuestCount = (databaseGuestCount === 8 ||
    (event.plan !== 'free_trial' && databaseGuestCount < planBasedGuestCount))
    ? planBasedGuestCount
    : databaseGuestCount

  const [currentGuestCount, setCurrentGuestCount] = useState(intelligentGuestCount)
  const [isUpdating, setIsUpdating] = useState(false)

  const updateEventSettings = useCallback(async (updates: any) => {
    setIsUpdating(true)
    console.log(`🔧 Frontend: Updating event settings:`, updates)
    try {
      const response = await fetch(`/api/events/${event.id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      console.log(`📡 Frontend: API response status:`, response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Frontend: API error:`, errorText)
        throw new Error('Failed to update settings')
      }

      const result = await response.json()
      console.log('✅ Frontend: Settings updated successfully:', result)
    } catch (error) {
      console.error('❌ Frontend: Failed to update settings:', error)
      toast.error('Failed to update settings')
    } finally {
      setIsUpdating(false)
    }
  }, [event.id])

  const handleDateChange = useCallback(async (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate)
      await updateEventSettings({
        eventDate: formatLocalDate(newDate),
      })
    }
  }, [updateEventSettings])

  const handleActivationDateChange = useCallback(async (newDate: Date | undefined) => {
    setActivationDate(newDate)
    await updateEventSettings({
      activationDate: newDate ? formatLocalDate(newDate) : null,
    })
  }, [updateEventSettings])

  const handleGuestViewChange = useCallback(async (checked: boolean) => {
    setGuestCanView(checked)
    await updateEventSettings({
      guestCanViewAlbum: checked,
    })
  }, [updateEventSettings])

  const handleGuestViewGuestbookChange = useCallback(async (checked: boolean) => {
    setGuestCanViewGuestbook(checked)
    await updateEventSettings({
      guestCanViewGuestbook: checked,
    })
  }, [updateEventSettings])

  const handleGuestViewAudioMessagesChange = useCallback(async (checked: boolean) => {
    setGuestCanViewAudioMessages(checked)
    await updateEventSettings({
      guestCanViewAudioMessages: checked,
    })
  }, [updateEventSettings])

  const handleAutoApproveChange = useCallback(async (checked: boolean) => {
    setAutoApprove(checked)
    await updateEventSettings({
      approveUploads: checked,
    })
  }, [updateEventSettings])

  const handleGuestDownloadChange = useCallback(async (checked: boolean) => {
    setGuestCanDownload(checked)

    // Update privacy settings JSON
    const currentPrivacySettings = getPrivacySettings()
    const updatedPrivacySettings = {
      ...currentPrivacySettings,
      allow_guest_downloads: checked
    }

    await updateEventSettings({
      privacySettings: JSON.stringify(updatedPrivacySettings),
    })
  }, [updateEventSettings])

  const handleGuestCountChange = useCallback(async (newCount: number) => {
    setCurrentGuestCount(newCount)
    await updateEventSettings({
      guestCount: newCount,
    })
  }, [updateEventSettings])

  const handleSelectPlan = useCallback(async (plan: Plan) => {
    if (isSelectingPlan) return

    setIsSelectingPlan(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          currency: selectedCurrency,
          eventId: event.id,
          context: 'dashboard',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout')
      }

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error: any) {
      console.error('Purchase error:', error)
      toast.error(error.message || 'Failed to start checkout process')
      setIsSelectingPlan(false)
    }
  }, [selectedCurrency, event.id, isSelectingPlan])

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

      {/* Choose Your Plan Card */}
      {(() => {
        const currentPlan = event.plan || 'free_trial';
        const isFreeTrial = currentPlan === 'free' || currentPlan === 'free_trial' || !event.plan;
        const isEternal = currentPlan === 'eternal';

        // If user has eternal plan, just show a simple status message
        if (isEternal) {
          return (
            <Card data-section="current-plan">
              <CardContent className="py-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Your current plan is Eternal</span>
                    <Badge variant="default" className="bg-primary text-primary-foreground">
                      Premium
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You're on our most premium plan with all features unlocked.
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        }

        // For free trial or paid plans that can be upgraded
        return (
          <Card data-section="choose-plan">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {isFreeTrial ? 'Choose Your Plan' : 'Your Plan & Upgrades'}
                </div>
                <Badge variant={trialStatus.isExpired ? "destructive" : (isFreeTrial ? "secondary" : "default")}>
                  {(() => {
                    if (isFreeTrial) {
                      return trialStatus.isExpired ? 'Free Trial - Expired' : 'Free Trial';
                    }
                    return planFeatures[currentPlan as keyof typeof planFeatures]?.name || 'Free Trial';
                  })()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Free Trial Status Banner - only for free trial users */}
              {isFreeTrial && (
                <div className={cn(
                  "border rounded-lg p-4",
                  trialStatus.isExpired
                    ? "bg-red-50 border-red-200"
                    : "bg-muted/50"
                )}>
                  <div className="flex items-center justify-center gap-2">
                    <span className={cn(
                      "font-semibold",
                      trialStatus.isExpired ? "text-red-900" : "text-foreground"
                    )}>
                      {trialStatus.isExpired ? (
                        <>Free Trial - Expired</>
                      ) : (
                        <>
                          You are currently on a free trial
                          {trialDaysRemaining > 0 && (
                            <span className="text-primary"> • {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left</span>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm mt-2 text-center",
                    trialStatus.isExpired ? "text-red-800" : "text-muted-foreground"
                  )}>
                    Choose a plan to be able to publish your gallery so it will be able to be viewed publicly!
                  </p>
                </div>
              )}

              {/* Paid Plan Status Banner - only for paid users */}
              {!isFreeTrial && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-foreground">
                    <span className="font-semibold">
                      Your current plan is {planFeatures[currentPlan as keyof typeof planFeatures]?.name}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Upgrade to unlock additional features and longer windows.
                  </p>
                </div>
              )}

              <PricingCards
                selectedCurrency={selectedCurrency}
                onCurrencyChange={setSelectedCurrency}
                onSelectPlan={handleSelectPlan}
                currentPlan={currentPlan}
                showFreeTrial={false}
                trialDaysRemaining={trialDaysRemaining}
                className=""
                showUpgradeOnly={!isFreeTrial}
              />
            </CardContent>
          </Card>
        );
      })()}

      {/* Publication Status Card */}
      <Card data-section="event-publication-status">
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
                  ? 'bg-muted text-muted-foreground border border-border'
                  : 'bg-secondary text-secondary-foreground border border-border font-semibold'
              )}
            >
              {event.isPublished ? 'Published' : 'Private'}
            </Badge>
          </div>

          {event.publishedAt && (
            <div className="text-xs text-muted-foreground">
              Published on {new Date(event.publishedAt).toLocaleString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </div>
          )}

          {/* Activation Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Gallery Activation Date
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
                  {activationDate ? format(activationDate, "EEEE, MMMM do, yyyy") : "When should guests be able to access?"}
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
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                When your gallery becomes publicly accessible to guests. You may want to activate your gallery a couple of months before your wedding so that you can include multiple events before your wedding such as a hen's night etc.
                {event.isPublished && " (Cannot be changed after publishing)"}
              </p>
            </div>
          </div>

          {/* Publish Button */}
          {!event.isPublished && (
            <div className="pt-4 border-t">
              <Button
                onClick={handlePublishEvent}
                disabled={!activationDate || isUpdating || (event.plan === 'free' || event.plan === 'free_trial' || !event.plan)}
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

              {/* Free trial message under disabled button */}
              {(event.plan === 'free' || event.plan === 'free_trial' || !event.plan) && (
                <div className="bg-muted/50 border rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-center gap-2 text-foreground">
                    <span className="font-semibold">
                      You are currently on a free trial
                      {trialDaysRemaining > 0 && (
                        <span className="text-primary"> • {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left</span>
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Choose a plan to be able to publish your gallery so it will be able to be viewed publicly!
                  </p>
                </div>
              )}

              {!(event.plan === 'free' || event.plan === 'free_trial' || !event.plan) && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Once published, the activation date cannot be changed
                </p>
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
        </CardContent>
      </Card>

      {/* Privacy & Moderation Settings Card */}
      <Card data-section="privacy-moderation">
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

          {/* Guest can view guestbook */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Allow guests to view guestbook messages</div>
              <div className="text-xs text-muted-foreground">
                Allow guests to see guestbook messages from other guests
              </div>
            </div>
            <Switch
              checked={guestCanViewGuestbook}
              onCheckedChange={handleGuestViewGuestbookChange}
              className="data-[state=checked]:bg-primary"
              disabled={isUpdating}
            />
          </div>

          {/* Guest can view audio messages */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Allow guests to view audio messages</div>
              <div className="text-xs text-muted-foreground">
                Allow guests to listen to audio messages from other guests
              </div>
            </div>
            <Switch
              checked={guestCanViewAudioMessages}
              onCheckedChange={handleGuestViewAudioMessagesChange}
              className="data-[state=checked]:bg-primary"
              disabled={isUpdating}
            />
          </div>

          {/* Guest Downloads */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Allow guest downloads</div>
              <div className="text-xs text-muted-foreground">
                Allow guests to download photos and videos from the gallery
              </div>
            </div>
            <Switch
              checked={guestCanDownload}
              onCheckedChange={handleGuestDownloadChange}
              className="data-[state=checked]:bg-primary"
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card>



      {/* Publish Upgrade Prompt */}
      {publishError && (
        <UpgradePrompt
          isOpen={upgradePromptOpen}
          onClose={() => {
            setUpgradePromptOpen(false)
            setPublishError(null)
          }}
          eventId={event.id}
          currentPlan={event.plan || 'free_trial'}
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