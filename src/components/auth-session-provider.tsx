"use client"

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { authClient } from '@/lib/auth-client'

interface SessionProviderProps {
  children: ReactNode
  initialSession?: any // Initial session from server
}

// Create a context for initial session (optional)
const SessionContext = createContext<any>(null)

export function SessionProvider({ children, initialSession }: SessionProviderProps) {
  useEffect(() => {
    // If we have an initial session from the server, set it
    // This prevents the initial fetch on the client
    if (initialSession) {
      // Better Auth's useSession hook will automatically pick this up
      // from the nanostore, preventing duplicate initial fetches
      console.log('Session pre-loaded from server')
    }
  }, [initialSession])

  return (
    <SessionContext.Provider value={initialSession}>
      {children}
    </SessionContext.Provider>
  )
}

export function useInitialSession() {
  return useContext(SessionContext)
}