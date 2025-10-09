"use client"

import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import useFreshchat from '@/hooks/use-freshchat'

/**
 * Freshchat Wrapper Component
 *
 * Integrates Freshworks Chat with Better Auth for user identification.
 * - Authenticated users: Shows name, email, user ID, and plan
 * - Anonymous users: Allows anonymous chat
 */
export function FreshchatWrapper() {
  const { data: session } = authClient.useSession()
  const [userPlan, setUserPlan] = useState<string>('free_trial')

  // Fetch user's current plan from events if authenticated
  useEffect(() => {
    if (session?.user?.id) {
      // You could fetch the user's plan from your API here
      // For now, we'll use free_trial as default
      // TODO: Fetch actual plan from user's events
      setUserPlan('free_trial')
    }
  }, [session?.user?.id])

  // Initialize Freshchat with user data if available
  useFreshchat({
    userId: session?.user?.id,
    userEmail: session?.user?.email || undefined,
    userName: session?.user?.name || undefined,
    userPlan: session?.user?.id ? userPlan : undefined,
  })

  return null // This component doesn't render anything
}
