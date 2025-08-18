"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check } from "lucide-react"

const currencies = [
  { code: "GBP", flag: "🇬🇧", symbol: "£" },
  { code: "USD", flag: "🇺🇸", symbol: "$" },
  { code: "EUR", flag: "🇪🇺", symbol: "€" },
  { code: "CAD", flag: "🇨🇦", symbol: "C$" },
  { code: "AUD", flag: "🇦🇺", symbol: "A$" },
  { code: "NZD", flag: "🇳🇿", symbol: "NZ$" },
]

const guestCounts = [8, 25, 50, 100, 200, 500]

const pricing = {
  8: { AUD: 0, USD: 0, GBP: 0, EUR: 0, CAD: 0, NZD: 0 }, // Free
  25: { AUD: 44, USD: 30, GBP: 22, EUR: 27, CAD: 38, NZD: 47 }, // Small
  50: { AUD: 77, USD: 52, GBP: 39, EUR: 47, CAD: 66, NZD: 82 }, // Medium  
  100: { AUD: 132, USD: 89, GBP: 67, EUR: 80, CAD: 113, NZD: 141 }, // Large
  200: { AUD: 242, USD: 163, GBP: 123, EUR: 147, CAD: 207, NZD: 258 }, // XLarge
  500: { AUD: 500, USD: 337, GBP: 254, EUR: 304, CAD: 428, NZD: 534 }, // Festival
}

const features = {
  8: [
    "5 Uploads Per Guest",
    "Live Realtime Slideshow",
    "Digital Guestbook",
    "Custom QR Code",
    "12 Month Album Access",
    "Basic features only",
  ],
  25: [
    "1 album",
    "Photos only",
    "Default theme",
    "3-month upload window",
    "12-month download",
    "Private QR + PIN",
    "Photo-only slideshow",
  ],
  50: [
    "1 album", 
    "Photos + videos",
    "Video guestbook",
    "3-month upload window",
    "12-month download",
    "Private QR + PIN",
    "Full slideshow",
  ],
  100: [
    "3 albums",
    "Choice of 15 themes", 
    "Photos + videos",
    "12-month upload window",
    "12-month download",
    "Private QR + PIN",
    "Full slideshow",
  ],
  200: [
    "6 albums",
    "Custom branding",
    "Choice of 15 themes",
    "Photos + videos", 
    "12-month upload window",
    "12-month download",
    "Private QR + PIN",
    "Full slideshow",
  ],
  500: [
    "Unlimited albums",
    "Custom branding",
    "Enterprise features",
    "Photos + videos",
    "12-month upload window", 
    "12-month download",
    "Private QR + PIN",
    "Full slideshow",
    "Priority support",
  ],
}

interface GuestCountPricingDialogProps {
  isOpen: boolean
  onClose: () => void
  currentGuestCount: number
  onGuestCountChange: (count: number) => void
}

export function GuestCountPricingDialog({
  isOpen,
  onClose,
  currentGuestCount,
  onGuestCountChange,
}: GuestCountPricingDialogProps) {
  const [selectedCurrency, setSelectedCurrency] = useState("AUD")
  const [selectedGuestCount, setSelectedGuestCount] = useState(currentGuestCount)

  const currentCurrency = currencies.find((c) => c.code === selectedCurrency)
  const currentPrice =
    pricing[selectedGuestCount as keyof typeof pricing][selectedCurrency as keyof (typeof pricing)[8]]
  const currentFeatures = features[selectedGuestCount as keyof typeof features] || features[8]

  const handleSelectPlan = () => {
    onGuestCountChange(selectedGuestCount)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Change Guest Count</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8">
          {/* Currency Selector */}
          <div className="flex justify-end">
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
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

          {/* Guest Count Question */}
          <h2 className="text-xl font-semibold text-center text-foreground">
            Up to How many guests are attending your event?
          </h2>

          {/* Guest Count Selector */}
          <div className="bg-secondary rounded-2xl p-2 shadow-lg border">
            <div className="flex flex-wrap justify-center gap-2">
              {guestCounts.map((count) => (
                <button
                  key={count}
                  onClick={() => setSelectedGuestCount(count)}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    selectedGuestCount === count
                      ? "bg-primary text-primary-foreground shadow-md scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Price Display */}
          <div className="text-center">
            {currentPrice === 0 ? (
              <div className="text-4xl font-bold text-primary mb-2">FREE</div>
            ) : (
              <div className="text-4xl font-bold text-primary mb-2">
                {currentCurrency?.symbol}
                {currentPrice}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              {selectedGuestCount === 8 && "Free Plan"}
              {selectedGuestCount === 25 && "Small Plan"}
              {selectedGuestCount === 50 && "Medium Plan"}
              {selectedGuestCount === 100 && "Large Plan"}
              {selectedGuestCount === 200 && "XLarge Plan"}
              {selectedGuestCount === 500 && "Festival Plan"}
            </div>
          </div>

          {/* Features Section */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="text-xl font-bold text-center mb-6 text-foreground">What's Included</h3>
            <div className="space-y-3">
              {currentFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <span className="text-sm text-foreground font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSelectPlan}
            >
              {currentPrice === 0 ? "Select Free Plan" : "Update Guest Count"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}