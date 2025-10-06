"use client"

import { useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import posthog from 'posthog-js'

/**
 * PostHog Session Tracker
 *
 * Tracks user authentication state with PostHog.
 * This is a separate component to avoid triggering duplicate session API calls
 * in the root Providers component. Better Auth's useSession() will be cached
 * via nanostore after the first call in the Header component.
 */
export function PostHogSessionTracker() {
    const { data: session } = authClient.useSession()

    useEffect(() => {
        if (session?.user) {
            // Identify user in PostHog when they sign in
            posthog.identify(session.user.id, {
                email: session.user.email,
                name: session.user.name,
            })
        } else {
            // Reset when user signs out
            posthog.reset()
        }
    }, [session])

    return null // This component doesn't render anything
}
