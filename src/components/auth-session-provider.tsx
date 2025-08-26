"use client"

import { createContext, useContext, ReactNode, useMemo, useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { setCachedSession, getCachedSessionFromCookie } from '@/lib/cookie-session-cache'

interface SessionProviderProps {
  children: ReactNode
  initialSession?: any // Initial session from cookie cache or server
}

// Create a context for session that all components can use
// This prevents multiple useSession() calls from different components
const SessionContext = createContext<ReturnType<typeof authClient.useSession> | null>(null)

export function SessionProvider({ children, initialSession }: SessionProviderProps) {
  // Call useSession only ONCE at the provider level
  // All child components will share this single hook instance
  const session = authClient.useSession()
  
  // Cache session data locally for faster subsequent reads
  useEffect(() => {
    if (session.data?.user && session.data?.session) {
      setCachedSession({
        user: session.data.user,
        session: session.data.session
      })
    } else if (session.data === null) {
      // Clear cache when logged out
      setCachedSession(null)
    }
  }, [session.data])
  
  // Memoize the session value to prevent unnecessary re-renders
  const sessionValue = useMemo(() => {
    return session
  }, [session])

  return (
    <SessionContext.Provider value={sessionValue}>
      {children}
    </SessionContext.Provider>
  )
}

// Custom hook that all components should use instead of authClient.useSession()
// This ensures they all share the same session instance
export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return context
}

// Optimized hook for read-only session checks (no API calls)
// Use this for simple authentication checks in UI components
export function useOptimizedSession() {
  // First try to get from cookie cache (instant, no API call)
  const cookieSession = getCachedSessionFromCookie()
  
  // Fallback to the main session context if cookie cache is empty
  const mainSession = useContext(SessionContext)
  
  if (cookieSession) {
    return {
      data: cookieSession,
      isLoading: false,
      isPending: false,
      error: null
    }
  }
  
  // Use main session as fallback
  return mainSession || {
    data: null,
    isLoading: true,
    isPending: true,
    error: null
  }
}