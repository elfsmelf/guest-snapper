// This component is deprecated and replaced by PricingModal
// Keeping for backward compatibility temporarily

"use client"

import { PricingModal } from "./pricing-modal"
import { type Currency } from "@/lib/pricing"

interface GuestCountPricingDialogProps {
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

// Wrapper component for backward compatibility
export function GuestCountPricingDialog(props: GuestCountPricingDialogProps) {
  return <PricingModal {...props} />
}