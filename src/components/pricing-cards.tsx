"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Crown, Heart, Infinity, Star } from "lucide-react"
import { formatCurrency, getPlanFeatures, getPrice, type Plan, type Currency } from "@/lib/pricing"
import { detectUserCurrency } from "@/lib/currency-detection"
import { cn } from "@/lib/utils"

const currencies = [
  { code: "USD" as Currency, flag: "🇺🇸", name: "US Dollar", symbol: "$" },
  { code: "AUD" as Currency, flag: "🇦🇺", name: "Australian Dollar", symbol: "A$" },
  { code: "GBP" as Currency, flag: "🇬🇧", name: "British Pound", symbol: "£" },
  { code: "EUR" as Currency, flag: "🇪🇺", name: "Euro", symbol: "€" },
  { code: "CAD" as Currency, flag: "🇨🇦", name: "Canadian Dollar", symbol: "C$" },
  { code: "NZD" as Currency, flag: "🇳🇿", name: "New Zealand Dollar", symbol: "NZ$" },
]

const planDetails = {
  bliss: {
    plan: "bliss" as Plan,
    icon: Heart,
    iconColor: "text-primary",
    borderColor: "border-muted",
    buttonColor: "bg-primary hover:bg-primary/90 text-primary-foreground",
    tagline: "SINGLE GALLERY",
    subtitle: "Perfect for intimate weddings",
    popular: false,
    uploadWindow: "3 Mo. Upload & 12 Mo. Download",
    features: [
      "Main Wedding Gallery",
      "Default Beautiful Theme",
      "3-Month Upload Window",
      "12-Month Download Window"
    ]
  },
  radiance: {
    plan: "radiance" as Plan,
    icon: Star,
    iconColor: "text-primary",
    borderColor: "border-primary/20",
    buttonColor: "bg-primary hover:bg-primary/90 text-primary-foreground",
    tagline: "INCLUDES ALBUMS",
    subtitle: "Most popular for weddings",
    popular: true,
    uploadWindow: "12 Mo. Upload & 12 Mo. Download",
    features: [
      "Main Gallery + 8 Albums",
      "Choice of 25 Beautiful Themes",
      "12-Month Upload Window",
      "12-Month Download Window"
    ]
  },
  eternal: {
    plan: "eternal" as Plan,
    icon: Crown,
    iconColor: "text-primary",
    borderColor: "border-muted",
    buttonColor: "bg-primary hover:bg-primary/90 text-primary-foreground",
    tagline: "MULTI-DAY EVENTS",
    subtitle: "Premium wedding experience",
    popular: false,
    uploadWindow: "12 Mo. Upload & 12 Mo. Download",
    features: [
      "Main Gallery + 15 Albums",
      "100% Customizable Themes & Colors",
      "12-Month Upload Window",
      "12-Month Download Window"
    ]
  }
}

interface PricingCardsProps {
  selectedCurrency?: Currency
  onCurrencyChange?: (currency: Currency) => void
  onSelectPlan?: (plan: Plan) => void
  currentPlan?: string
  showFreeTrial?: boolean
  trialDaysRemaining?: number
  className?: string
  showUpgradeOnly?: boolean
}

export function PricingCards({
  selectedCurrency,
  onCurrencyChange,
  onSelectPlan,
  currentPlan,
  showFreeTrial = true,
  trialDaysRemaining = 7,
  className,
  showUpgradeOnly = false
}: PricingCardsProps) {
  const [currency, setCurrency] = useState<Currency>(selectedCurrency || detectUserCurrency())

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency)
    onCurrencyChange?.(newCurrency)
  }

  const currentCurrencyData = currencies.find(c => c.code === currency)

  // Plan hierarchy for upgrade filtering
  const planHierarchy = ['bliss', 'radiance', 'eternal'] as Plan[]

  // Filter plans based on showUpgradeOnly
  const getAvailablePlans = () => {
    if (!showUpgradeOnly || !currentPlan) {
      return Object.entries(planDetails) as [keyof typeof planDetails, typeof planDetails[keyof typeof planDetails]][]
    }

    const currentPlanIndex = planHierarchy.indexOf(currentPlan as Plan)
    if (currentPlanIndex === -1) {
      // If current plan is not in hierarchy (free_trial, free), show all plans
      return Object.entries(planDetails) as [keyof typeof planDetails, typeof planDetails[keyof typeof planDetails]][]
    }

    // Only show plans that are higher than current plan
    const upgradeablePlans = planHierarchy.slice(currentPlanIndex + 1)
    return Object.entries(planDetails).filter(([key]) =>
      upgradeablePlans.includes(key as Plan)
    ) as [keyof typeof planDetails, typeof planDetails[keyof typeof planDetails]][]
  }

  const availablePlans = getAvailablePlans()

  // If no plans to show (shouldn't happen, but safety check)
  if (availablePlans.length === 0) {
    return null
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Included in Every Package - only show for new users */}
      {!showUpgradeOnly && (
        <div className="mb-6 sm:mb-8 text-center max-w-5xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-5 tracking-wide">INCLUDED IN EVERY PACKAGE</h3>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 text-base sm:text-lg">
              <div className="flex items-center justify-center gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span><strong>Unlimited</strong> Guests & Co-Hosts</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span><strong>Unlimited</strong> Photo and Video Uploads</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Live Slideshow</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Gallery Privacy Settings</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Audio and Messages Guestbook</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>20+ Canva Templates</span>
              </div>
            </div>
          </div>
      )}

      {/* Currency Selector */}
      <div className="flex justify-center mb-8 sm:mb-12">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">Switch Currency</p>
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-48">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{currentCurrencyData?.flag}</span>
                    <span className="font-medium">{currency}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{curr.flag}</span>
                      <span>{curr.code} - {curr.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
      </div>

      {/* Pricing Cards */}
      <div className={cn(
        "grid gap-8 md:gap-6 max-w-7xl mx-auto",
        availablePlans.length === 1 ? "grid-cols-1 max-w-md" :
        availablePlans.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-4xl" :
        "grid-cols-1 md:grid-cols-3"
      )}>
        {availablePlans.map(([key, details]) => {
          const features = getPlanFeatures(details.plan)
          const price = getPrice(details.plan, currency)
          const isCurrentPlan = currentPlan === details.plan
          const Icon = details.icon

          return (
            <Card
              key={key}
              className={cn(
                "relative flex flex-col",
                details.borderColor,
                details.popular ? "border-2 shadow-lg scale-105" : "border",
                isCurrentPlan && "ring-2 ring-primary"
              )}
            >
              {/* Popular Badge */}
              {details.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold uppercase mb-2">
                  {details.plan}
                </CardTitle>

                <div className="text-4xl font-bold mb-2">
                  {currentCurrencyData?.symbol}{(price / 100).toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  one-time
                </div>

                <div className="bg-primary/10 text-primary font-bold text-sm py-2 px-4 rounded mb-2">
                  {details.tagline}
                </div>

                <CardDescription className="text-sm text-muted-foreground">
                  {details.subtitle}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-grow">
                <ul className="space-y-3 mb-4">
                  {details.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      </div>
                      <span className="text-sm font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="border-t pt-4">
                  <div className="text-sm font-semibold text-center text-primary">
                    {details.uploadWindow}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-6">
                {isCurrentPlan ? (
                  <div className="w-full text-center py-3 text-primary font-semibold">
                    <Check className="h-5 w-5 mx-auto mb-1" />
                    Current Plan
                  </div>
                ) : (
                  <Button
                    className={cn("w-full", details.buttonColor)}
                    onClick={() => onSelectPlan?.(details.plan)}
                    size="lg"
                  >
                    {showUpgradeOnly ? 'Upgrade' : 'Choose This Plan'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Bottom Guarantees */}
      <div className="text-center mt-8 space-y-2">
        <p className="text-sm text-muted-foreground">
          🔒 Secure payment • 🔄 14-day money-back guarantee • ✅ No recurring fees
        </p>
        <p className="text-xs text-muted-foreground">
          All plans include <strong>unlimited wedding guests</strong> and 180+ Canva QR code templates
        </p>
      </div>
    </div>
  )
}