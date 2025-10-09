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
 */
export function FreshchatWrapper() {
  const { data: session } = authClient.useSession()
  const [userPlan, setUserPlan] = useState<string>('free_trial')
  const [widgetReady, setWidgetReady] = useState(false)

  const token = process.env.NEXT_PUBLIC_FRESHCHAT_TOKEN
  const host = process.env.NEXT_PUBLIC_FRESHCHAT_HOST || 'https://au.fw-cdn.com'

  // Fetch user's current plan from events if authenticated
  useEffect(() => {
    if (session?.user?.id) {
      // TODO: Fetch actual plan from user's events/subscription
      setUserPlan('free_trial')
    }
  }, [session?.user?.id])

  // Enrich user data when widget is ready and session changes
  useEffect(() => {
    if (!widgetReady || !window.fcWidget || !session?.user) return

    console.log('Enriching Freshchat with user data...')

    try {
      // Update basic user identification
      if (session.user.id) {
        window.fcWidget.setExternalId(session.user.id)
      }

      // Update user name (Freshchat will split into first/last automatically if configured)
      if (session.user.name) {
        window.fcWidget.user.setFirstName(session.user.name)
      }
      if (session.user.email) {
        window.fcWidget.user.setEmail(session.user.email)
      }

      // Add custom properties (use cf_ prefix for custom fields)
      // NOTE: For these to display nicely in Freshchat agent interface, you need to:
      // 1. Go to Freshchat > Contacts > Add field
      // 2. Create custom fields with matching names (e.g., "plan", "user_id", "signup_date")
      // 3. Choose appropriate field type (Text, Dropdown, Date, etc.)
      // Even without pre-creating fields, properties are stored - they just appear as raw key-value pairs
      const customProperties: Record<string, any> = {
        cf_user_id: session.user.id,
        cf_plan: userPlan,
      }

      // Add signup date if available
      if (session.user.createdAt) {
        customProperties.cf_signup_date = new Date(session.user.createdAt).toISOString()
      }

      // Add email verified status
      if (typeof session.user.emailVerified !== 'undefined') {
        customProperties.cf_email_verified = session.user.emailVerified ? 'Yes' : 'No'
      }

      // Add image/avatar URL if available
      if (session.user.image) {
        customProperties.cf_avatar_url = session.user.image
      }

      window.fcWidget.user.setProperties(customProperties)
      console.log('Freshchat user data enriched:', customProperties)
    } catch (error) {
      console.error('Failed to enrich Freshchat user data:', error)
    }
  }, [widgetReady, session?.user, userPlan])

  if (!token) {
    console.warn('Freshchat token not configured')
    return null
  }

  // Get basic user info for initial fcSettings
  const firstName = session?.user?.name?.split(' ')[0] || undefined
  const userId = session?.user?.id
  const userEmail = session?.user?.email

  return (
    <>
      <Script
        id="freshchat-settings"
        strategy="beforeInteractive"
      >
        {`
          window.fcSettings = {
            token: "${token}",
            host: "${host}",${userId ? `
            externalId: "${userId}",` : ''}${firstName ? `
            firstName: "${firstName}",` : ''}${userEmail ? `
            email: "${userEmail}",` : ''}
            onInit: function() {
              console.log('Freshchat widget initialized successfully!');
              window.fcWidgetInitialized = true;

              // Trigger React component to know widget is ready
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
          // Listen for widget ready event
          const handleReady = () => {
            setWidgetReady(true)
          }
          window.addEventListener('freshchat-ready', handleReady)

          // Cleanup
          return () => window.removeEventListener('freshchat-ready', handleReady)
        }}
        onError={(e) => {
          console.error('Failed to load Freshchat script:', e)
        }}
      />
    </>
  )
}
