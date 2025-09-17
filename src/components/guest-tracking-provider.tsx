"use client"

import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { initializeGuestId } from "@/app/actions/guest-tracking"

interface GuestTrackingProviderProps {
  children: React.ReactNode
  forcePublicView?: boolean
}

/**
 * Client component that initializes guest tracking for anonymous users
 * This runs after the initial static render to preserve cache performance
 */
export function GuestTrackingProvider({ children, forcePublicView }: GuestTrackingProviderProps) {
  const { data: session, isPending } = authClient.useSession()
  const [guestIdReady, setGuestIdReady] = useState(false)

  useEffect(() => {
    // Initialize guest tracking for anonymous users
    if (!isPending) {
      if (!session?.user) {
        // Anonymous user - initialize guest ID
        initializeGuestId()
          .then((guestId) => {
            console.log('Guest ID initialized:', guestId)
            setGuestIdReady(true)
          })
          .catch((error) => {
            console.error('Failed to initialize guest ID:', error)
            // Still set ready to avoid blocking the UI
            setGuestIdReady(true)
          })
      } else {
        // Authenticated user - no guest ID needed
        setGuestIdReady(true)
      }
    }
  }, [session, isPending])

  // Don't render children until guest tracking is ready
  // This ensures guest ID is set before any uploads can happen
  if (!guestIdReady) {
    return null
  }

  return <>{children}</>
}