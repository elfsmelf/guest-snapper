"use client"

import { createContext, useContext, ReactNode, useMemo } from 'react'
import { authClient } from '@/lib/auth-client'

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
  
  // Memoize the session value to prevent unnecessary re-renders
  const sessionValue = useMemo(() => {
    // If we have initial session from cookie cache and the hook hasn't loaded yet,
    // we could merge them, but Better Auth's nanostore should handle this
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