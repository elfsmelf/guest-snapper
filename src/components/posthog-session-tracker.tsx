"use client"

import { useEffect, useRef } from 'react'
import { authClient } from '@/lib/auth-client'
import posthog from 'posthog-js'

/**
 * PostHog Session Tracker with OAuth Tracking Continuity
 *
 * Tracks user authentication state with PostHog while preserving
 * anonymous tracking across OAuth redirects.
 *
 * How it works:
 * 1. Continuously stores the current anonymous distinct_id in sessionStorage
 * 2. When user authenticates (via OAuth or email), links the pre-auth anonymous ID
 * 3. Uses posthog.alias() to connect anonymous session to identified user
 * 4. Prevents tracking loss during Google OAuth redirect flow
 */
export function PostHogSessionTracker() {
    const { data: session } = authClient.useSession()
    const hasIdentified = useRef(false)

    // Store anonymous ID in sessionStorage before any auth action
    useEffect(() => {
        if (typeof window === 'undefined') return

        const storeAnonymousId = () => {
            try {
                const distinctId = posthog.get_distinct_id()
                if (distinctId && !session?.user) {
                    // Only store if user is not already authenticated
                    sessionStorage.setItem('ph_pre_auth_distinct_id', distinctId)
                }
            } catch (error) {
                console.error('Failed to store PostHog anonymous ID:', error)
            }
        }

        // Store on mount and periodically (in case it changes)
        storeAnonymousId()
        const interval = setInterval(storeAnonymousId, 1000)

        return () => clearInterval(interval)
    }, [session])

    // Handle user identification with anonymous session linking
    useEffect(() => {
        if (session?.user) {
            // Only identify once per session to avoid duplicate alias calls
            if (hasIdentified.current) return
            hasIdentified.current = true

            try {
                const preAuthId = sessionStorage.getItem('ph_pre_auth_distinct_id')
                const currentId = posthog.get_distinct_id()

                // Link anonymous session to identified user if we have a pre-auth ID
                if (preAuthId && preAuthId !== session.user.id) {
                    console.log('PostHog: Linking anonymous session to authenticated user')
                    // Alias links the anonymous ID to the user ID
                    posthog.alias(session.user.id, preAuthId)
                }

                // Identify user in PostHog
                posthog.identify(session.user.id, {
                    email: session.user.email,
                    name: session.user.name,
                })

                // Clean up stored anonymous ID
                sessionStorage.removeItem('ph_pre_auth_distinct_id')
            } catch (error) {
                console.error('PostHog identification error:', error)
                // Still try to identify even if aliasing fails
                posthog.identify(session.user.id, {
                    email: session.user.email,
                    name: session.user.name,
                })
            }
        } else {
            // Reset identification flag when user signs out
            hasIdentified.current = false
            posthog.reset()
        }
    }, [session])

    return null // This component doesn't render anything
}
