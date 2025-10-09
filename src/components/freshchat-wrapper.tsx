"use client"

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { authClient } from '@/lib/auth-client'

declare global {
  interface Window {
    fcSettings?: {
      token: string
      host: string
      externalId?: string
      firstName?: string
      email?: string
      onInit?: () => void
    }
    fcWidget?: {
      setExternalId: (id: string) => void
      user: {
        setFirstName: (name: string) => void
        setEmail: (email: string) => void
        setProperties: (properties: Record<string, any>) => void
        create: () => Promise<{ data: any }>
        get: () => Promise<{ data: any }>
      }
      isInitialized: () => boolean
      open: () => void
      close: () => void
      hide: () => void
      show: () => void
    }
    fcWidgetInitialized?: boolean
  }
}

/**
 * Freshchat Wrapper Component
 *
 * Integrates Freshworks Chat with Better Auth for user identification.
 * - Authenticated users: Shows name, email, user ID, and plan
 * - Anonymous users: Allows anonymous chat
 *
 * IMPORTANT: All user data must be set immediately after widget initialization
 * to ensure it's applied before the user sends their first message. Freshchat
 * creates the user record on first message, not when setExternalId() is called.
 */
export function FreshchatWrapper() {
  const { data: session } = authClient.useSession()
  const [userPlan, setUserPlan] = useState<string>('free_trial')
  const [widgetReady, setWidgetReady] = useState(false)
  const [userDataSet, setUserDataSet] = useState(false)

  const token = process.env.NEXT_PUBLIC_FRESHCHAT_TOKEN
  const host = process.env.NEXT_PUBLIC_FRESHCHAT_HOST || 'https://au.fw-cdn.com'

  // Fetch user's current plan from events if authenticated
  useEffect(() => {
    if (session?.user?.id) {
      // TODO: Fetch actual plan from user's events/subscription
      setUserPlan('free_trial')
    }
  }, [session?.user?.id])

  // Debug: Log when session changes
  useEffect(() => {
    console.log('[Freshchat] Session state:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userName: session?.user?.name
    })
  }, [session])

  // Debug: Log when widget ready state changes
  useEffect(() => {
    console.log('[Freshchat] Widget ready state:', widgetReady)
    if (widgetReady) {
      console.log('[Freshchat] fcWidget available:', !!window.fcWidget)
    }
  }, [widgetReady])

  // Set up event listener for widget initialization AND check if already initialized
  useEffect(() => {
    console.log('[Freshchat] Setting up widget detection...')

    // Check if widget is already initialized
    if (window.fcWidget && window.fcWidget.isInitialized && window.fcWidget.isInitialized()) {
      console.log('[Freshchat] Widget already initialized on mount!')
      setWidgetReady(true)
      return
    }

    // Listen for initialization event
    const handleReady = () => {
      console.log('[Freshchat] Received freshchat-ready event')
      setWidgetReady(true)
    }

    window.addEventListener('freshchat-ready', handleReady)
    console.log('[Freshchat] Event listener added for freshchat-ready')

    // Polling fallback - check if widget becomes available (with 10s timeout)
    let pollCount = 0
    const maxPolls = 100 // 10 seconds at 100ms intervals
    const pollInterval = setInterval(() => {
      pollCount++
      if (window.fcWidget && window.fcWidget.isInitialized && window.fcWidget.isInitialized()) {
        console.log('[Freshchat] Widget detected via polling!')
        setWidgetReady(true)
        clearInterval(pollInterval)
      } else if (pollCount >= maxPolls) {
        console.warn('[Freshchat] Widget polling timeout after 10s')
        clearInterval(pollInterval)
      }
    }, 100)

    // Cleanup
    return () => {
      console.log('[Freshchat] Cleaning up widget detection listeners')
      window.removeEventListener('freshchat-ready', handleReady)
      clearInterval(pollInterval)
    }
  }, []) // Run once on mount

  // Set user data immediately when both widget is ready AND session is available
  useEffect(() => {
    console.log('[Freshchat] User data effect check:', {
      widgetReady,
      hasFcWidget: !!window.fcWidget,
      hasSessionUser: !!session?.user,
      userDataSet,
      shouldRun: widgetReady && !!window.fcWidget && !!session?.user && !userDataSet
    })

    if (!widgetReady || !window.fcWidget || !session?.user || userDataSet) {
      console.log('[Freshchat] Skipping user data set - conditions not met')
      return
    }

    console.log('[Freshchat] ✅ Setting Freshchat user data NOW...')
    console.log('[Freshchat] Session user data:', session.user)

    try {
      const userId = session.user.id
      const userName = session.user.name
      const userEmail = session.user.email
      const firstName = userName?.split(' ')[0]
      const createdAt = session.user.createdAt
      const emailVerified = session.user.emailVerified
      const avatarUrl = session.user.image

      // Set basic user identification
      if (userId) {
        console.log('[Freshchat] Calling setExternalId with:', userId)
        window.fcWidget.setExternalId(userId)
        console.log('[Freshchat] ✓ Set external ID:', userId)
      } else {
        console.warn('[Freshchat] ⚠️ No userId available')
      }

      if (firstName) {
        console.log('[Freshchat] Calling setFirstName with:', firstName)
        window.fcWidget.user.setFirstName(firstName)
        console.log('[Freshchat] ✓ Set first name:', firstName)
      } else {
        console.warn('[Freshchat] ⚠️ No firstName available')
      }

      if (userEmail) {
        console.log('[Freshchat] Calling setEmail with:', userEmail)
        window.fcWidget.user.setEmail(userEmail)
        console.log('[Freshchat] ✓ Set email:', userEmail)
      } else {
        console.warn('[Freshchat] ⚠️ No userEmail available')
      }

      // Set custom properties (use cf_ prefix for custom fields)
      const customProperties: Record<string, any> = {
        cf_user_id: userId,
        cf_plan: userPlan,
      }

      if (createdAt) {
        customProperties.cf_signup_date = new Date(createdAt).toISOString()
      }

      if (typeof emailVerified !== 'undefined') {
        customProperties.cf_email_verified = emailVerified ? 'Yes' : 'No'
      }

      if (avatarUrl) {
        customProperties.cf_avatar_url = avatarUrl
      }

      console.log('[Freshchat] Calling setProperties with:', customProperties)
      window.fcWidget.user.setProperties(customProperties)
      console.log('[Freshchat] ✓ Set custom properties:', customProperties)

      // Force user creation immediately to ensure data is captured
      // before first message is sent
      console.log('[Freshchat] Calling user.create()...')
      window.fcWidget.user.create().then(
        (response) => {
          console.log('[Freshchat] ✅ User created successfully:', response)
          setUserDataSet(true)
        },
        (error) => {
          // User might already exist, which is fine
          console.log('[Freshchat] User creation response (may already exist):', error)
          setUserDataSet(true)
        }
      )
    } catch (error) {
      console.error('[Freshchat] ❌ Failed to set user data:', error)
    }
  }, [widgetReady, session?.user, userPlan, userDataSet])

  if (!token) {
    console.warn('Freshchat token not configured')
    return null
  }

  return (
    <>
      <Script
        id="freshchat-settings"
        strategy="beforeInteractive"
      >
        {`
          window.fcSettings = {
            token: "${token}",
            host: "${host}",
            onInit: function() {
              console.log('Freshchat widget initialized');
              window.fcWidgetInitialized = true;

              // Trigger event for React component to set user data
              window.dispatchEvent(new Event('freshchat-ready'));
            }
          };
          console.log('Freshchat settings configured');
        `}
      </Script>

      <Script
        id="freshchat-widget"
        src="https://au.fw-cdn.com/20945682/366721.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[Freshchat] Widget script loaded')
        }}
        onError={(e) => {
          console.error('[Freshchat] Failed to load script:', e)
        }}
      />
    </>
  )
}
