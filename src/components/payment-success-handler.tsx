"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { GuestCountPricingDialog } from './guest-count-pricing-dialog'
import type { Currency } from '@/lib/pricing'

interface PaymentSuccessHandlerProps {
  eventId: string
  currentPlan?: string
  eventCurrency?: Currency
}

export function PaymentSuccessHandler({ 
  eventId, 
  currentPlan, 
  eventCurrency 
}: PaymentSuccessHandlerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  
  useEffect(() => {
    const paymentSuccessParam = searchParams.get('payment_success')
    const sessionId = searchParams.get('session_id')
    const paymentCancelled = searchParams.get('payment_cancelled')
    
    if (paymentSuccessParam === 'true' && sessionId) {
      // Verify payment and get session data
      fetchPaymentData(sessionId)
    } else if (paymentCancelled === 'true') {
      // Just open the dialog normally for cancelled payments
      setDialogOpen(true)
      // Clean up URL
      const newUrl = window.location.pathname
      router.replace(newUrl)
    }
  }, [searchParams, router])
  
  const fetchPaymentData = async (sessionId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setPaymentData({
          sessionId: data.id,
          amount: data.amount_total,
          currency: data.currency,
          plan: data.metadata?.plan || 'unknown'
        })
        setPaymentSuccess(true)
        setDialogOpen(true)
      }
    } catch (error) {
      console.error('Error fetching payment data:', error)
    } finally {
      setLoading(false)
      // Clean up URL parameters
      const newUrl = window.location.pathname
      router.replace(newUrl)
    }
  }
  
  const handleDialogClose = () => {
    setDialogOpen(false)
    setPaymentSuccess(false)
    setPaymentData(null)
    // No need to reload - user is already on the correct page
  }
  
  // Function to open dialog manually (for upgrade button)
  const openUpgradeDialog = () => {
    setPaymentSuccess(false)
    setPaymentData(null)
    setDialogOpen(true)
  }
  
  return (
    <GuestCountPricingDialog
      isOpen={dialogOpen}
      onClose={handleDialogClose}
      eventId={eventId}
      currentPlan={currentPlan || 'free'}
      eventCurrency={eventCurrency || 'AUD'}
      paymentSuccess={paymentSuccess}
      paymentData={paymentData}
    />
  )
}