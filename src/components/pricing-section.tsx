"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Check, CheckCircle, Lock, Shield } from "lucide-react"
import { type Currency, pricingMatrix } from "@/lib/pricing"
import { detectUserCurrency } from "@/lib/currency-detection"

const currencyFlags: Record<Currency, string> = {
  AUD: "🇦🇺",
  USD: "🇺🇸",
  GBP: "🇬🇧",
  EUR: "🇪🇺",
  CAD: "🇨🇦",
  NZD: "🇳🇿"
}

const currencySymbols: Record<Currency, string> = {
  AUD: "A$",
  USD: "$",
  GBP: "£",
  EUR: "€",
  CAD: "C$",
  NZD: "NZ$"
}

export function PricingSection() {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("USD")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const detectedCurrency = detectUserCurrency()
    setSelectedCurrency(detectedCurrency)
    setIsLoading(false)
  }, [])

  const getPrice = (plan: "essential" | "timeless" | "premier") => {
    const priceInCents = pricingMatrix[plan][selectedCurrency]
    const price = priceInCents / 100
    return `${currencySymbols[selectedCurrency]}${Math.floor(price)}`
  }

  return (
    <section className="py-16 bg-gradient-to-br from-secondary/5 to-accent/5">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-serif">
            Choose Your Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Here for the moments you don't want to miss!
          </p>

          {/* What's Included */}
          <div className="max-w-3xl mx-auto bg-white rounded-xl p-6 mb-8">
            <p className="font-semibold text-foreground mb-4">INCLUDED IN EVERY PACKAGE</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Unlimited Guests & Co-Hosts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Unlimited Photo and Video Uploads</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Live Slideshow</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Gallery Privacy Settings</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Audio and Messages Guestbook</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <span>180+ Canva Templates</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Try everything privately for 7 days, then unlock guest access with any plan below.
              Purchase now for peace of mind, you can activate it later—your gallery won't go live until YOU decide it's time.
            </p>
          </div>

          {/* Currency Selector */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground">Switch Currency</span>
            <Select
              value={selectedCurrency}
              onValueChange={(value) => setSelectedCurrency(value as Currency)}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AUD">
                  <span className="flex items-center gap-2">
                    <span>{currencyFlags.AUD}</span>
                    <span>AUD</span>
                  </span>
                </SelectItem>
                <SelectItem value="USD">
                  <span className="flex items-center gap-2">
                    <span>{currencyFlags.USD}</span>
                    <span>USD</span>
                  </span>
                </SelectItem>
                <SelectItem value="GBP">
                  <span className="flex items-center gap-2">
                    <span>{currencyFlags.GBP}</span>
                    <span>GBP</span>
                  </span>
                </SelectItem>
                <SelectItem value="EUR">
                  <span className="flex items-center gap-2">
                    <span>{currencyFlags.EUR}</span>
                    <span>EUR</span>
                  </span>
                </SelectItem>
                <SelectItem value="CAD">
                  <span className="flex items-center gap-2">
                    <span>{currencyFlags.CAD}</span>
                    <span>CAD</span>
                  </span>
                </SelectItem>
                <SelectItem value="NZD">
                  <span className="flex items-center gap-2">
                    <span>{currencyFlags.NZD}</span>
                    <span>NZD</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Essential Plan */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground mb-2">Essential</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold">{getPrice("essential")}</span>
                  <span className="text-muted-foreground">one-time</span>
                </div>
                <p className="text-sm font-semibold text-muted-foreground">SINGLE GALLERY</p>
                <p className="text-sm text-muted-foreground">Perfect for intimate weddings</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">Main Wedding Gallery</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">Default Beautiful Theme</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">3-Month Upload Window</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">12-Month Download Window</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-semibold">3 Mo. Upload & 12 Mo. Download</span>
                </div>
              </div>

              <Button className="w-full" variant="outline" asChild>
                <Link href="/auth/sign-in">Create My Gallery</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Timeless Plan */}
          <Card className="relative overflow-hidden border-primary border-2">
            <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-1 text-sm font-semibold">
              Most Popular
            </div>
            <CardContent className="p-6 pt-10">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground mb-2">Timeless</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold">{getPrice("timeless")}</span>
                  <span className="text-muted-foreground">one-time</span>
                </div>
                <p className="text-sm font-semibold text-muted-foreground">INCLUDES ALBUMS</p>
                <p className="text-sm text-muted-foreground">Most popular for weddings</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">Main Gallery + 8 Albums</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">Choice of 25 Beautiful Themes</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">12-Month Upload Window</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">12-Month Download Window</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-semibold">12 Mo. Upload & 12 Mo. Download</span>
                </div>
              </div>

              <Button className="w-full" asChild>
                <Link href="/auth/sign-in">Create My Gallery</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Premier Plan */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground mb-2">Premier</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold">{getPrice("premier")}</span>
                  <span className="text-muted-foreground">one-time</span>
                </div>
                <p className="text-sm font-semibold text-muted-foreground">MULTI-DAY EVENTS</p>
                <p className="text-sm text-muted-foreground">Premium wedding experience</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">Main Gallery + 15 Albums</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">100% Customizable Themes & Colors</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">12-Month Upload Window</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">12-Month Download Window</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-semibold">12 Mo. Upload & 12 Mo. Download</span>
                </div>
              </div>

              <Button className="w-full" variant="outline" asChild>
                <Link href="/auth/sign-in">Create My Gallery</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Secure payment</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>14-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>No recurring fees</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            All plans include unlimited wedding guests and 180+ Canva QR code templates
          </p>
        </div>
      </div>
    </section>
  )
}