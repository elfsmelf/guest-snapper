"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useQueryClient } from '@tanstack/react-query'
import { useEventData } from '@/hooks/use-onboarding'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, Check, CheckCircle, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency, getPlanFeatures, getPrice, getUpgradePrice, isPlanUpgrade, type Plan, type Currency } from "@/lib/pricing"
import { type OnboardingState } from "@/types/onboarding"
import { updateOnboardingProgress } from "@/app/actions/onboarding"

interface GuestCountStepProps {
  eventId: string
  eventSlug: string
  eventName: string
  state: OnboardingState
  onUpdate: (updates: Partial<OnboardingState>) => void
  onComplete: () => Promise<any>
}

const currencies = [
  { code: "AUD" as Currency, flag: "🇦🇺", name: "Australian Dollar", symbol: "A$" },
  { code: "USD" as Currency, flag: "🇺🇸", name: "US Dollar", symbol: "$" },
  { code: "GBP" as Currency, flag: "🇬🇧", name: "British Pound", symbol: "£" },
  { code: "EUR" as Currency, flag: "🇪🇺", name: "Euro", symbol: "€" },
  { code: "CAD" as Currency, flag: "🇨🇦", name: "Canadian Dollar", symbol: "C$" },
  { code: "NZD" as Currency, flag: "🇳🇿", name: "New Zealand Dollar", symbol: "NZ$" },
]

// Guest counts mapped to plans
const guestCounts = [8, 10, 25, 50, 100, 200, 999999] // 999999 represents unlimited
const guestCountToPlans: Record<number, { plan: Plan; name: string }> = {
  8: { plan: 'starter', name: 'Free Trial (8 guests)' }, // Free tier shows as starter plan features but $0
  10: { plan: 'starter', name: 'Starter Plan' },
  25: { plan: 'small', name: 'Small Plan' },
  50: { plan: 'medium', name: 'Medium Plan' },
  100: { plan: 'large', name: 'Large Plan' },
  200: { plan: 'xlarge', name: 'XLarge Plan' },
  999999: { plan: 'unlimited', name: 'Unlimited Plan' }
}

// Features for each guest count
const features = {
  8: [
    "Owner & collaborators can view",
    "Upload & organize photos/videos", 
    "Live realtime slideshow",
    "Digital guestbook",
    "Custom QR code",
    "Gallery stays private",
    "⚠️ Upgrade required to make public",
  ],
  default: [
    "Public gallery access",
    "Unlimited video & photo uploads",
    "Real-time album feed",
    "Digital guestbook", 
    "Custom QR code",
    "12 month album access",
    "Enhanced slideshow features"
  ]
}

export function GuestCountStep({
  eventId,
  eventSlug,
  eventName,
  state,
  onUpdate,
  onComplete
}: GuestCountStepProps) {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Use React Query to fetch event data
  const { data: eventData } = useEventData(eventId)
  
  // Initialize state based on event data
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    (eventData?.currency as Currency) || 'AUD'
  )
  const [selectedGuestCount, setSelectedGuestCount] = useState<number>(
    eventData?.guestCount || 8
  )
  const [loading, setLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string>(
    eventData?.plan || 'free'
  )
  const [eventCurrency, setEventCurrency] = useState<Currency>(
    (eventData?.currency as Currency) || 'AUD'
  )
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const isComplete = state.guestCountSet || paymentSuccess

  // Update state when event data changes
  useEffect(() => {
    if (eventData) {
      if (eventData.plan && eventData.plan !== 'free') {
        setCurrentPlan(eventData.plan)
        // Set guest count from database if already set
        if (eventData.guestCount && eventData.guestCount > 0) {
          setSelectedGuestCount(eventData.guestCount)
        }
      }
      if (eventData.currency) {
        setEventCurrency(eventData.currency as Currency)
        setSelectedCurrency(eventData.currency as Currency)
      }
    }
  }, [eventData])

  // Handle payment success/cancel from URL params
  const paymentSuccessParam = searchParams.get('payment_success')
  const sessionId = searchParams.get('session_id')
  const paymentCancelled = searchParams.get('payment_cancelled')
  
  // Process payment success immediately
  React.useEffect(() => {
    if (paymentSuccessParam === 'true' && sessionId && !processingPayment && !paymentSuccess) {
      fetchPaymentData(sessionId)
    } else if (paymentCancelled === 'true') {
      toast.error('Payment was cancelled. You can try again anytime.')
      // Clean up URL
      const newUrl = `/onboarding?slug=${eventSlug}&step=4`
      router.replace(newUrl)
    }
  }, [paymentSuccessParam, sessionId, paymentCancelled, processingPayment, paymentSuccess, eventSlug, router])


  const fetchPaymentData = async (sessionId: string) => {
    setProcessingPayment(true)
    try {
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.payment_status === 'paid') {
        setPaymentData({
          sessionId: data.id,
          amount: data.amount_total,
          currency: data.currency,
          plan: data.metadata?.plan || 'unknown'
        })
        setPaymentSuccess(true)
        toast.success('🎉 Payment successful! Your gallery has been upgraded.')
        
        // Update the current plan immediately for UI consistency
        if (data.metadata?.plan) {
          setCurrentPlan(data.metadata.plan)
          
          // Update guest count based on the plan purchased
          const planToGuestCount: Record<string, number> = {
            'starter': 10,
            'small': 25,
            'medium': 50,
            'large': 100,
            'xlarge': 200,
            'unlimited': 999999
          }
          const guestCount = planToGuestCount[data.metadata.plan] || 50
          setSelectedGuestCount(guestCount)
        }

        // Update onboarding state 
        onUpdate({ 
          guestCountSet: true, 
          paymentCompleted: true 
        })
        
        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['onboarding', eventId] })
        queryClient.invalidateQueries({ queryKey: ['events', eventId] })
      } else {
        throw new Error('Payment verification failed')
      }
    } catch (error) {
      console.error('Error fetching payment data:', error)
      toast.error('Payment verification failed. Please contact support.')
    } finally {
      setProcessingPayment(false)
      // Clean up URL parameters
      const newUrl = `/onboarding?slug=${eventSlug}&step=4`
      router.replace(newUrl)
    }
  }

  const currentCurrency = currencies.find((c) => c.code === selectedCurrency)
  
  // Get current plan info
  const selectedPlanInfo = guestCountToPlans[selectedGuestCount]
  const selectedPlan = selectedPlanInfo.plan
  
  // Get price for selected plan and currency
  const isUpgradeFromCurrent = isPlanUpgrade(currentPlan, selectedPlan)
  const upgradePrice = getUpgradePrice(currentPlan, selectedPlan, selectedCurrency)
  const fullPrice = getPrice(selectedPlan, selectedCurrency)
  
  // Use upgrade price if this is an upgrade, otherwise full price
  const currentPrice = selectedGuestCount === 8 ? 0 : (isUpgradeFromCurrent ? upgradePrice : fullPrice)
  const currentFeatures = selectedGuestCount === 8 ? features[8] : features.default
  
  // Check if this is current user's plan
  const isCurrentPlan = currentPlan === selectedPlan || (currentPlan === 'free' && selectedGuestCount === 8)

  const handlePurchase = async () => {
    if (loading) return
    
    if (selectedGuestCount === 8) {
      // Free plan - just update the settings and continue
      try {
        const response = await fetch(`/api/events/${eventId}/settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestCount: 8,
            plan: 'free',
            currency: selectedCurrency,
          }),
        })

        if (response.ok) {
          toast.success('Free plan selected!')
          onUpdate({ guestCountSet: true })
          // Invalidate queries to refresh the UI
          queryClient.invalidateQueries({ queryKey: ['onboarding', eventId] })
          queryClient.invalidateQueries({ queryKey: ['events', eventId] })
        } else {
          throw new Error('Failed to update settings')
        }
      } catch (error) {
        toast.error('Failed to update settings')
      }
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          currency: selectedCurrency,
          eventId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error: any) {
      console.error('Purchase error:', error)
      toast.error(error.message || 'Failed to start checkout process')
      setLoading(false)
    }
  }


  return (
    <div className="space-y-6">
      {/* Step Introduction */}
      <div className="text-center space-y-3">
        <p className="text-muted-foreground">
          How many guests will be attending {eventName}? This helps us choose the right plan for your gallery.
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 border-t border-muted-foreground/20"></div>
        <span className="text-sm font-medium text-muted-foreground">STEP 4</span>
        <div className="flex-1 border-t border-muted-foreground/20"></div>
      </div>

      {processingPayment ? (
        <Card className="border-2 border-primary/30 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12 space-y-4 flex-col">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">Verifying your payment...</p>
                <p className="text-sm text-muted-foreground">This will only take a moment</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : paymentSuccess && paymentData ? (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 shadow-lg">
          <CardContent className="pt-6 space-y-6">
            {/* Success Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 dark:text-green-100 flex items-center justify-center gap-2">
                  Payment Successful! <Sparkles className="w-5 h-5" />
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  Your gallery has been upgraded to the {paymentData.plan} plan
                </p>
              </div>
            </div>
            
            {/* Payment Details */}
            <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4 space-y-2 border border-green-200">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-green-800 dark:text-green-200">Amount Paid:</span>
                <span className="font-bold text-green-900 dark:text-green-100">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: paymentData.currency.toUpperCase(),
                  }).format(paymentData.amount / 100)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-green-800 dark:text-green-200">Plan:</span>
                <span className="font-bold text-green-900 dark:text-green-100">
                  {paymentData.plan.charAt(0).toUpperCase() + paymentData.plan.slice(1)} Plan
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-green-800 dark:text-green-200">Status:</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-bold text-green-900 dark:text-green-100">Paid & Active</span>
                </div>
              </div>
            </div>
            
            {/* Features Unlocked */}
            <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4 border border-green-200">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Features Unlocked
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {['Public gallery access', 'Unlimited uploads', 'Enhanced slideshow', '12 month access'].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-800 dark:text-green-200">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

          </CardContent>
        </Card>
      ) : isComplete ? (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Perfect! Guest count is set
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your gallery is configured for {selectedGuestCount === 999999 ? 'unlimited' : selectedGuestCount} guests
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Currency Selection */}
          <div className="flex justify-center">
            <Select 
              value={selectedCurrency} 
              onValueChange={(value) => setSelectedCurrency(value as Currency)}
              disabled={currentPlan !== 'free'}
            >
              <SelectTrigger className="w-48 h-12 border-2 border-border rounded-xl bg-card shadow-sm">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{currentCurrency?.flag}</span>
                    <span className="font-medium">{selectedCurrency}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{currency.flag}</span>
                      <span>{currency.code}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Guest Count Selection */}
          <Card className="border-2 border-primary/30 shadow-lg">
            <CardContent className="pt-6 space-y-6">
              <div className="bg-muted/30 border rounded-2xl p-3">
                <div className="flex flex-wrap justify-center gap-2">
                  {guestCounts.map((count) => (
                    <button
                      key={count}
                      onClick={() => setSelectedGuestCount(count)}
                      disabled={loading}
                      className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                        selectedGuestCount === count
                          ? "bg-primary text-primary-foreground shadow-md scale-105"
                          : "text-muted-foreground hover:text-foreground hover:bg-card hover:shadow-sm"
                      }`}
                    >
                      {count === 999999 ? "Unlimited" : count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price display */}
              <div className="text-center">
                {currentPrice === 0 ? (
                  <div className="text-4xl font-bold text-primary mb-2">FREE</div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-4xl font-bold text-foreground">
                      {currentCurrency?.symbol}{currentPrice / 100}
                    </div>
                    {isUpgradeFromCurrent && upgradePrice < fullPrice && (
                      <div className="text-xs text-muted-foreground">
                        Upgrade price • Full price: {formatCurrency(fullPrice, selectedCurrency)}
                      </div>
                    )}
                  </div>
                )}
                {isCurrentPlan && (
                  <Badge className="mt-2">Current Plan</Badge>
                )}
              </div>

              {/* Features section */}
              <div className="bg-muted/30 rounded-xl border p-4">
                <h4 className="font-semibold text-center mb-4">What's Included</h4>
                <div className="space-y-2">
                  {currentFeatures.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  {currentFeatures.length > 4 && (
                    <div className="text-xs text-muted-foreground text-center pt-2">
                      + {currentFeatures.length - 4} more features
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {isCurrentPlan ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <p className="text-green-700 font-medium">Current Plan Selected</p>
                  </div>
                ) : (
                  <Button
                    onClick={handlePurchase}
                    disabled={loading}
                    size="lg"
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      currentPrice === 0 ? "Get Started Free" : `Select ${selectedPlanInfo.name}`
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="font-medium mb-2">💡 Pro Tips:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Free plan:</strong> Perfect for testing and private galleries</li>
          <li>• <strong>Paid plans:</strong> Enable public galleries and advanced features</li>
          <li>• <strong>Guest count:</strong> You can always upgrade if you need more capacity</li>
          <li>• <strong>Currency:</strong> Choose your preferred currency for billing</li>
        </ul>
      </div>
    </div>
  )
}