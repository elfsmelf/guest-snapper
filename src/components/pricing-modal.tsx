"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { type Currency, type Plan } from "@/lib/pricing"
import { detectUserCurrency } from "@/lib/currency-detection"
import { PricingCards } from "./pricing-cards"

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  currentPlan?: string
  eventCurrency?: Currency
  paymentSuccess?: boolean
  paymentData?: {
    sessionId: string
    amount: number
    currency: string
    plan: string
  }
}

export function PricingModal({
  isOpen,
  onClose,
  eventId,
  currentPlan = 'free_trial',
  eventCurrency,
  paymentSuccess = false,
  paymentData,
}: PricingModalProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(eventCurrency || detectUserCurrency())
  const [loading, setLoading] = useState(false)

  const handleSelectPlan = async (plan: Plan) => {
    if (loading || plan === currentPlan) return

    setLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          currency: selectedCurrency,
          eventId,
          context: 'modal',
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
      alert(error.message || 'Failed to start checkout process')
      setLoading(false)
    }
  }

  const handleStartFreeTrial = () => {
    // For now, just close the modal - free trial logic would be implemented separately
    onClose()
  }

  // Payment Success UI
  if (paymentSuccess && paymentData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center space-y-6 py-6">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle className="w-12 h-12 text-primary-foreground" />
            </div>

            {/* Success Title */}
            <div className="space-y-2">
              <DialogTitle className="text-3xl font-bold">
                Payment Successful! 🎉
              </DialogTitle>
              <p className="text-lg text-muted-foreground">
                Your wedding gallery has been upgraded to the {paymentData?.plan} plan
              </p>
            </div>

            {/* Payment Details */}
            <div className="bg-card border rounded-xl p-6 space-y-3 shadow-sm">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">Amount:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: (paymentData?.currency || 'USD').toUpperCase(),
                  }).format((paymentData?.amount || 0) / 100)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">Plan:</span>
                <span className="font-semibold capitalize">{paymentData?.plan} Plan</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">Status:</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="font-semibold">Paid</span>
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="bg-muted/30 border rounded-xl p-4">
              <p className="text-sm text-muted-foreground">
                ✨ Your wedding gallery features have been unlocked and you can now publish your gallery!
              </p>
            </div>

            {/* Action Button */}
            <Button
              onClick={onClose}
              size="lg"
              className="px-8 py-3 text-lg font-semibold rounded-xl shadow-sm"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Continue to Wedding Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Regular Pricing UI
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-6">
        <DialogHeader className="text-center mb-6">
          <DialogTitle className="text-3xl font-bold">
            Choose Your Wedding Gallery Plan
          </DialogTitle>
          <p className="text-muted-foreground mt-2">
            All plans include <strong>unlimited wedding guests</strong>
          </p>
        </DialogHeader>

        <div className="space-y-8">
          {/* Free Trial CTA */}
          <div className="text-center">
            <Button
              onClick={handleStartFreeTrial}
              variant="outline"
              size="lg"
              className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-800 px-8 py-3"
            >
              🎉 Start 7-Day Free Trial - No Credit Card Required
            </Button>
          </div>

          {/* Pricing Cards */}
          <PricingCards
            selectedCurrency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
            onSelectPlan={handleSelectPlan}
            currentPlan={currentPlan}
            showFreeTrial={false}
          />

          {/* Cancel Button */}
          <div className="flex justify-center pt-4">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}