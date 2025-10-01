"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Globe, Calendar as CalendarIcon, Clock, Loader2, Gift, ArrowRight } from "lucide-react"
import { format, addMonths } from "date-fns"
import { parseLocalDate, formatLocalDate } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { type OnboardingState } from "@/types/onboarding"
import { updateOnboardingProgress } from "@/app/actions/onboarding"
import { useEventData, eventKeys } from "@/hooks/use-onboarding"
import { getPlanFeatures, type Plan, type Currency } from "@/lib/pricing"
import { PricingCards } from "@/components/pricing-cards"
import { detectUserCurrency } from "@/lib/currency-detection"

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isUpdatingDate, setIsUpdatingDate] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(detectUserCurrency())
  const [showPricingCards, setShowPricingCards] = useState(false)
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

  const handleInitiatePublish = async () => {
    if (!activationDate) {
      toast.error('Please set an activation date first')
      return
    }

    // Check if user has a paid plan
    const currentPlan = event?.plan || 'free_trial'
    if (currentPlan === 'free_trial' || currentPlan === 'free' || !event?.plan) {
      // Show pricing cards within the onboarding flow
      setShowPricingCards(true)
      return
    }

    // User has paid plan, proceed with publishing
    await publishGallery()
  }

  const publishGallery = async () => {
    setIsPublishing(true)
    try {
      const response = await fetch(`/api/events/${eventId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublished: true,
          publishedAt: new Date().toISOString(),
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
    if (!activationDate) return null
    // Use the current plan, or default to bliss if no paid plan selected
    const planToUse = (event?.plan && event.plan !== 'free_trial') ? event.plan : 'bliss'
    const planFeatures = getPlanFeatures(planToUse)
    return addMonths(activationDate, planFeatures.uploadWindowMonths)
  }

  const getDownloadEndDate = () => {
    if (!activationDate) return null
    // Use the current plan, or default to bliss if no paid plan selected
    const planToUse = (event?.plan && event.plan !== 'free_trial') ? event.plan : 'bliss'
    const planFeatures = getPlanFeatures(planToUse)
    return addMonths(activationDate, planFeatures.downloadWindowMonths)
  }


  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="text-center space-y-3 px-2">
        <p className="text-sm sm:text-base text-muted-foreground">
          You've built an amazing gallery! Now let's activate it for your guests to enjoy.
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex-1 border-t border-muted-foreground/20"></div>
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">STEP 6</span>
        <div className="flex-1 border-t border-muted-foreground/20"></div>
      </div>

      {/* Pricing Cards Section - Show when user clicks publish without a paid plan */}
      {showPricingCards && (
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Choose Your Plan</h3>
            <p className="text-sm text-muted-foreground">
              Select a plan to publish your gallery and start collecting memories
            </p>
          </div>
          <PricingCards
            selectedCurrency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
          />
          <Button
            variant="outline"
            onClick={() => setShowPricingCards(false)}
            className="w-full"
          >
            Back to Gallery Setup
          </Button>
        </div>
      )}

      {/* Activation Date - Hide when showing pricing cards */}
      {!showPricingCards && (
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

        {/* Gallery Windows - Show immediately after activation date */}
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
                  <div className="text-xs text-muted-foreground mt-1">
                    {(() => {
                      const planToUse = (event?.plan && event.plan !== 'free_trial') ? event.plan : 'bliss'
                      const features = getPlanFeatures(planToUse)
                      const isDefaultPlan = !event?.plan || event.plan === 'free_trial'
                      return `${features.uploadWindowMonths} months duration${isDefaultPlan ? ' (with paid plan)' : ''}`
                    })()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-sm font-medium mb-1">Download Window</div>
                  <div className="text-xs text-muted-foreground">
                    {format(activationDate, "MMM d, yyyy")} - {getDownloadEndDate() ? format(getDownloadEndDate()!, "MMM d, yyyy") : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {(() => {
                      const planToUse = (event?.plan && event.plan !== 'free_trial') ? event.plan : 'bliss'
                      const features = getPlanFeatures(planToUse)
                      const isDefaultPlan = !event?.plan || event.plan === 'free_trial'
                      return `${features.downloadWindowMonths} months duration${isDefaultPlan ? ' (with paid plan)' : ''}`
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Note: These windows are based on your selected plan and can be extended.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {!event?.isPublished && (
          <div className="space-y-3">
            <Button
              onClick={handleInitiatePublish}
              disabled={!activationDate || isPublishing}
              className="w-full"
              size="lg"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating Gallery...
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Publish Gallery
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              {(event?.plan === 'free_trial' || event?.plan === 'free' || !event?.plan)
                ? "We'll help you choose the right plan for your needs"
                : "Your gallery will be immediately accessible to guests"
              }
            </p>
          </div>
        )}

        {/* Success message for published galleries */}
        {event?.isPublished && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <div className="font-medium text-green-900 dark:text-green-100 mb-1">🎉 Your gallery is live and ready for guests!</div>
            <p className="text-sm text-green-700 dark:text-green-300">
              Your gallery is now publicly accessible. Guests can view, upload, and engage with your beautiful wedding memories!
            </p>
            {event?.publishedAt && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                Activated on {new Date(event.publishedAt).toLocaleString(undefined, {
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

      </div>
      )}
    </div>
  )
}