"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, CheckCircle, Loader2, Gift } from "lucide-react"
import { toast } from "sonner"
import { type Plan, type Currency } from "@/lib/pricing"
import { type OnboardingState } from "@/types/onboarding"
import { updateOnboardingProgress } from "@/app/actions/onboarding"
import { PricingCards } from "@/components/pricing-cards"
import { detectUserCurrency } from "@/lib/currency-detection"

interface PricingStepProps {
  eventId: string
  eventSlug: string
  eventName: string
  state: OnboardingState
  onUpdate: (updates: Partial<OnboardingState>) => void
  onComplete: () => Promise<any>
}

export function PricingStep({
  eventId,
  eventSlug,
  eventName,
  state,
  onUpdate,
  onComplete
}: PricingStepProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(detectUserCurrency())

  // Check if payment has been completed
  const isPaymentCompleted = state.paymentCompleted || false
  const currentPlan = ('paymentPlan' in state && state.paymentPlan) || 'free_trial'

  const handleStartFreeTrial = async () => {
    setLoading(true)

    try {
      // Update the onboarding state to reflect free trial selection
      const updates = {
        guestCountSet: true,
        selectedPlan: 'free_trial',
        paymentCompleted: false,
        currency: selectedCurrency
      }

      onUpdate(updates)

      // Also persist to database
      await updateOnboardingProgress(eventId, updates)

      // Mark step as complete
      await onComplete()

      toast.success('Free trial started! You can upgrade anytime.')
    } catch (error) {
      console.error('Failed to start free trial:', error)
      toast.error('Failed to start free trial. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async (plan: Plan) => {
    if (loading) return

    setLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          currency: selectedCurrency,
          eventId,
          context: 'onboarding',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout')
      }

      if (data.url) {
        // Store the selected plan before redirecting
        const updates = {
          selectedPlan: plan,
          currency: selectedCurrency,
          guestCountSet: true
        }

        onUpdate(updates)
        await updateOnboardingProgress(eventId, updates)

        // Redirect to Stripe checkout
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

  // If payment is already completed, show success state
  if (isPaymentCompleted && currentPlan !== 'free_trial') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">
              Payment Successful! 🎉
            </h3>
            <p className="text-muted-foreground">
              Your wedding gallery has been upgraded to the <span className="font-semibold capitalize">{currentPlan}</span> plan
            </p>
          </div>

          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Plan:</span>
                  <span className="font-semibold capitalize">{currentPlan}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Guests:</span>
                  <span className="font-semibold">Unlimited ✨</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground">
            All features have been unlocked! Continue setting up your gallery.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pricing Cards */}
      <div className="max-w-4xl mx-auto">
        <PricingCards
          selectedCurrency={selectedCurrency}
          onCurrencyChange={setSelectedCurrency}
          onSelectPlan={handleSelectPlan}
          currentPlan={currentPlan}
          showFreeTrial={false}
          className="scale-90"
        />
      </div>

      {/* Or Divider */}
      <div className="flex items-center justify-center">
        <div className="border-t border-muted flex-1"></div>
        <span className="px-4 text-sm text-muted-foreground bg-background">or start with a free trial</span>
        <div className="border-t border-muted flex-1"></div>
      </div>

      {/* Free Trial Option */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gift className="w-6 h-6" />
            <h4 className="text-xl font-bold">Start with a Free Trial</h4>
          </div>

          <p className="text-muted-foreground mb-4">
            Try all features for 7 days, no credit card required. Perfect for testing everything before your big day!
            <br />
            <span className="text-sm font-medium">Note: Your gallery won't be publicly visible during the trial.</span>
          </p>

          <Button
            onClick={handleStartFreeTrial}
            disabled={loading}
            size="lg"
            variant="outline"
            className="px-8"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting Trial...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Start 7-Day Free Trial
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground mt-2">
            No commitment • Upgrade anytime • 14-day money-back guarantee
          </p>
        </CardContent>
      </Card>

    </div>
  )
}