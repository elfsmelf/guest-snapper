import { useEffect } from 'react'

declare global {
  interface Window {
    fcWidget?: {
      init: (config: {
        token: string
        host: string
        externalId?: string
        firstName?: string
        lastName?: string
        email?: string
      }) => void
      on: (event: string, callback: (data?: any) => void) => void
      setExternalId: (id: string) => void
      user: {
        setFirstName: (name: string) => void
        setEmail: (email: string) => void
        setProperties: (properties: Record<string, string | boolean>) => void
        clear: () => void
        get: (callback: (response: any) => void) => void
      }
      destroy: () => void
      isInitialized: () => boolean
      isLoaded: () => boolean
      open: () => void
      close: () => void
    }
    fcSettings?: {
      token: string
      host: string
      onInit?: () => void
    }
  }
}

interface UseFreshchatOptions {
  userEmail?: string
  userName?: string
  userId?: string
  userPlan?: string
}

const useFreshchat = (options?: UseFreshchatOptions) => {
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_FRESHCHAT_TOKEN
    const host = process.env.NEXT_PUBLIC_FRESHCHAT_HOST || 'https://au.fw-cdn.com'

    if (!token) {
      console.warn('Freshchat token not configured')
      return
    }

    function initFreshChat() {
      if (!window.fcWidget) return

      try {
        // Initialize widget with user data if available
        const initConfig: any = {
          token,
          host,
        }

        // Add user identification for logged-in users
        if (options?.userId) {
          initConfig.externalId = options.userId
        }
        if (options?.userName) {
          initConfig.firstName = options.userName
        }
        if (options?.userEmail) {
          initConfig.email = options.userEmail
        }

        window.fcWidget.init(initConfig)

        // Set additional user properties on widget load
        window.fcWidget.on('widget:loaded', function() {
          if (options?.userPlan) {
            window.fcWidget?.user.setProperties({
              plan: options.userPlan,
            })
          }
        })

      } catch (error) {
        console.error('Failed to initialize Freshchat:', error)
      }
    }

    function initialize(i: Document, t: string) {
      // Check if script already exists
      if (i.getElementById(t)) {
        initFreshChat()
        return
      }

      // Create and load Freshchat script
      const e = i.createElement('script')
      e.id = t
      e.async = true
      e.src = `${host}/js/widget.js`
      e.onload = initFreshChat
      e.onerror = () => {
        console.error('Failed to load Freshchat script')
      }
      i.head.appendChild(e)
    }

    function initiateCall() {
      initialize(document, 'freshchat-js-sdk')
    }

    // Initialize on load
    if (window.addEventListener) {
      window.addEventListener('load', initiateCall, false)
    } else if ((window as any).attachEvent) {
      (window as any).attachEvent('load', initiateCall)
    } else {
      initiateCall()
    }

    // Cleanup function
    return () => {
      // Note: We don't destroy the widget on unmount to persist across page navigation
      // Only clear user data if explicitly logging out
    }
  }, [options?.userId, options?.userEmail, options?.userName, options?.userPlan])
}

export default useFreshchat
