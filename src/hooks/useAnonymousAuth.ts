"use client"

import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"

export function useAnonymousAuth() {
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Use the reactive session hook from Better Auth
  const session = authClient.useSession()
  
  useEffect(() => {
    const initializeAnonymousUser = async () => {
      try {
        // Wait a bit for the session to load from storage/cookies
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Check again after waiting
        if (session.data) {
          console.log('Existing session found:', session.data)
          setIsInitialized(true)
          return
        }

        // Double-check by getting session directly
        const currentSession = await authClient.getSession()
        if (currentSession?.data) {
          console.log('Session found via getSession:', currentSession.data)
          setIsInitialized(true)
          return
        }

        // Only sign in anonymously if truly no session exists
        console.log('No session found, signing in anonymously...')
        const result = await (authClient.signIn as any).anonymous()
        
        if (result.error) {
          console.error('Anonymous sign-in error:', result.error)
          // If error is because user is already anonymous, that's actually fine
          if (result.error.code === 'ANONYMOUS_USERS_CANNOT_SIGN_IN_AGAIN_ANONYMOUSLY') {
            console.log('User already has anonymous session, continuing...')
          }
        } else {
          console.log('Anonymous sign-in successful:', result)
        }
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize anonymous user:', error)
        setIsInitialized(true) // Still set initialized to prevent infinite loading
      }
    }

    // Only run once
    if (!isInitialized) {
      initializeAnonymousUser()
    }
  }, [isInitialized]) // Remove session.data from dependencies to prevent re-runs

  return { isInitialized, session: session.data }
}