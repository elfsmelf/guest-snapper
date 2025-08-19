"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Zap, Star, Sparkles, ArrowUp } from "lucide-react"
import { getPlanFeatures, formatCurrency, getPrice, getUpgradePrice, type Plan, type Currency } from "@/lib/pricing"
import { GuestCountPricingDialog } from "./guest-count-pricing-dialog"

interface UpgradePromptProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  currentPlan?: string
  eventCurrency?: Currency
  reason: string
  suggestedPlan: Plan
  feature?: string
  actionText?: string
}

const planIcons: Record<string, any> = {
  free: <Check className="w-4 h-4 text-muted-foreground" />,
  starter: <Zap className="w-4 h-4 text-blue-500" />,
  small: <Star className="w-4 h-4 text-green-500" />,
  medium: <Sparkles className="w-4 h-4 text-purple-500" />,
  large: <Crown className="w-4 h-4 text-yellow-500" />,
  xlarge: <Crown className="w-4 h-4 text-orange-500" />,
  unlimited: <Crown className="w-4 h-4 text-red-500" />,
}

export function UpgradePrompt({
  isOpen,
  onClose,
  eventId,
  currentPlan = 'free',
  eventCurrency = 'AUD',
  reason,
  suggestedPlan,
  feature,
  actionText = "Continue"
}: UpgradePromptProps) {
  const [showFullPricing, setShowFullPricing] = useState(false)

  const currentFeatures = getPlanFeatures(currentPlan)
  const suggestedFeatures = getPlanFeatures(suggestedPlan)
  const upgradePrice = getUpgradePrice(currentPlan, suggestedPlan, eventCurrency)
  const fullPrice = getPrice(suggestedPlan, eventCurrency)
  const isUpgrade = currentPlan !== 'free'

  const handleUpgradeClick = () => {
    setShowFullPricing(true)
  }

  if (showFullPricing) {
    return (
      <GuestCountPricingDialog
        isOpen={isOpen}
        onClose={onClose}
        eventId={eventId}
        currentPlan={currentPlan}
        eventCurrency={eventCurrency}
      />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="text-center space-y-6 py-4">
          {/* Feature Icon */}
          <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
            <ArrowUp className="w-8 h-8 text-primary" />
          </div>
          
          {/* Title */}
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-bold">
              Upgrade Required
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {reason}
            </DialogDescription>
          </div>

          {/* Current vs Suggested Plan Comparison */}
          <div className="bg-card border rounded-xl p-4 space-y-4">
            {/* Current Plan */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                {planIcons[currentPlan]}
                <div>
                  <div className="font-medium text-sm">{currentFeatures.name}</div>
                  <div className="text-xs text-muted-foreground">Current plan</div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Active
              </Badge>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowUp className="w-5 h-5 text-primary" />
            </div>

            {/* Suggested Plan */}
            <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-3">
                {planIcons[suggestedPlan]}
                <div>
                  <div className="font-medium text-sm">{suggestedFeatures.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {isUpgrade && upgradePrice < fullPrice ? (
                      <>
                        {formatCurrency(upgradePrice, eventCurrency)} upgrade
                        <span className="text-muted-foreground/60"> • {formatCurrency(fullPrice, eventCurrency)} full</span>
                      </>
                    ) : (
                      `${formatCurrency(fullPrice, eventCurrency)} one-time`
                    )}
                  </div>
                </div>
              </div>
              <Badge className="text-xs">
                Recommended
              </Badge>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="bg-card border rounded-xl p-4">
            <h4 className="font-semibold text-sm mb-3">What you'll get:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Check className="w-4 h-4 text-primary" />
                <span>
                  {suggestedFeatures.guestLimit === 999999 ? 'Unlimited' : suggestedFeatures.guestLimit} guests 
                  <span className="text-muted-foreground">
                    {' '}(vs {currentFeatures.guestLimit === 999999 ? 'unlimited' : currentFeatures.guestLimit})
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Check className="w-4 h-4 text-primary" />
                <span>
                  {suggestedFeatures.albumLimit === 999999 ? 'Unlimited' : suggestedFeatures.albumLimit} albums
                  <span className="text-muted-foreground">
                    {' '}(vs {currentFeatures.albumLimit === 999999 ? 'unlimited' : currentFeatures.albumLimit})
                  </span>
                </span>
              </div>
              {suggestedFeatures.publicAccess && !currentFeatures.publicAccess && (
                <div className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Public gallery access</span>
                </div>
              )}
              {suggestedFeatures.videoGuestbook && !currentFeatures.videoGuestbook && (
                <div className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Video guestbook</span>
                </div>
              )}
              {suggestedFeatures.customBranding && !currentFeatures.customBranding && (
                <div className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Custom branding</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleUpgradeClick}
              className="w-full"
              size="lg"
            >
              Upgrade to {suggestedFeatures.name}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full"
              size="sm"
            >
              {actionText}
            </Button>
          </div>

          {/* View All Plans Link */}
          <button 
            onClick={handleUpgradeClick}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            View all plans and pricing
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}