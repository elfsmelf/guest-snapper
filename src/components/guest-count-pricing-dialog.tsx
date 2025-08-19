"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Check, CheckCircle, ArrowRight } from "lucide-react"
import { formatCurrency, getPlanFeatures, getPrice, getUpgradePrice, isPlanUpgrade, type Plan, type Currency } from "@/lib/pricing"

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

interface StripePaymentDialogProps {
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

export function GuestCountPricingDialog({
  isOpen,
  onClose,
  eventId,
  currentPlan = 'free',
  eventCurrency = 'AUD',
  paymentSuccess = false,
  paymentData,
}: StripePaymentDialogProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(eventCurrency)
  const [selectedGuestCount, setSelectedGuestCount] = useState<number>(8)
  const [loading, setLoading] = useState(false)

  const currentCurrency = currencies.find((c) => c.code === selectedCurrency)
  
  // Get current plan info
  const selectedPlanInfo = guestCountToPlans[selectedGuestCount]
  const selectedPlan = selectedPlanInfo.plan
  
  // Get price for selected plan and currency (upgrade price vs full price)
  const isUpgradeFromCurrent = isPlanUpgrade(currentPlan, selectedPlan)
  const upgradePrice = getUpgradePrice(currentPlan, selectedPlan, selectedCurrency)
  const fullPrice = getPrice(selectedPlan, selectedCurrency)
  
  // Use upgrade price if this is an upgrade, otherwise full price
  const currentPrice = selectedGuestCount === 8 ? 0 : (isUpgradeFromCurrent ? upgradePrice : fullPrice)
  const currentFeatures = selectedGuestCount === 8 ? features[8] : features.default
  
  // Check if this is current user's plan
  const isCurrentPlan = currentPlan === selectedPlan || (currentPlan === 'free' && selectedGuestCount === 8)

  const handlePurchase = async () => {
    if (loading || selectedGuestCount === 8) return // Don't allow purchasing free tier

    console.log('Payment request:', { plan: selectedPlan, currency: selectedCurrency, eventId })
    
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
      alert(error.message || 'Failed to start checkout process')
      setLoading(false)
    }
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
              <DialogDescription className="text-lg text-muted-foreground">
                Your event has been upgraded to the {paymentData.plan} plan
              </DialogDescription>
            </div>
            
            {/* Payment Details */}
            <div className="bg-card border rounded-xl p-6 space-y-3 shadow-sm">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">Amount:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: paymentData.currency.toUpperCase(),
                  }).format(paymentData.amount / 100)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">Plan:</span>
                <span className="font-semibold">{paymentData.plan} Plan</span>
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
                ✨ Your event features have been unlocked and you can now publish your gallery!
              </p>
            </div>
            
            {/* Action Button */}
            <Button 
              onClick={onClose}
              size="lg" 
              className="px-8 py-3 text-lg font-semibold rounded-xl shadow-sm"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Continue to Event Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Regular Pricing UI
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-12">
          <DialogHeader>
            <DialogTitle className="text-6xl font-bold">Prices</DialogTitle>
          </DialogHeader>
          <Select 
            value={selectedCurrency} 
            onValueChange={(value) => setSelectedCurrency(value as Currency)}
            disabled={currentPlan !== 'free'} // Lock currency after first payment
          >
            <SelectTrigger className="w-40 h-12 border-2 border-border rounded-xl bg-card shadow-sm">
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

        <h2 className="text-3xl font-semibold text-center mb-8">
          Up to How many guests are attending your event?
        </h2>

        {/* Guest Count Selection */}
        <div className="bg-muted/30 border rounded-2xl p-2 mb-12 shadow-sm">
          <div className="flex flex-wrap justify-center gap-2">
            {guestCounts.map((count) => (
              <button
                key={count}
                onClick={() => setSelectedGuestCount(count)}
                disabled={loading}
                className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-200 ${
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

        <div className="max-w-2xl mx-auto">
          {/* Price display */}
          <div className="text-center mb-8">
            {currentPrice === 0 ? (
              <div className="text-7xl font-bold text-primary mb-2">FREE</div>
            ) : (
              <div className="space-y-2">
                <div className="text-7xl font-bold text-foreground">
                  {currentCurrency?.symbol}{currentPrice / 100}
                </div>
                {isUpgradeFromCurrent && upgradePrice < fullPrice && (
                  <div className="text-sm text-muted-foreground">
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
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-center mb-8">What's Included</h3>
            <div className="space-y-4">
              {currentFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              {isCurrentPlan ? (
                <Button disabled className="px-12 py-4 text-lg font-semibold rounded-xl">
                  Current Plan
                </Button>
              ) : (
                <Button
                  onClick={handlePurchase}
                  disabled={loading}
                  size="lg"
                  className="px-12 py-4 text-lg font-semibold rounded-xl shadow-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    currentPrice === 0 ? "Get Started Free" : `Select ${selectedPlanInfo.name}`
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Cancel Button */}
          <div className="flex justify-center pt-6">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}