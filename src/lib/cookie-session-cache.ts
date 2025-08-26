/**
 * Client-side session cache using cookies
 * This prevents excessive API calls to get-session endpoint
 */

// import { getCookieCache } from "better-auth/cookies" // Server-side only

interface CachedSession {
  user: any
  session: any
}

interface SessionCache {
  data: CachedSession | null
  timestamp: number
  maxAge: number // in milliseconds
}

const CACHE_KEY = '__session_cache'
const DEFAULT_MAX_AGE = 5 * 60 * 1000 // 5 minutes

/**
 * Get session data from localStorage cache without making API requests
 * This should be used for read-only session checks in components
 */
export function getCachedSessionFromCookie(): CachedSession | null {
  if (typeof document === 'undefined') {
    return null // SSR
  }

  try {
    // Use localStorage cache for client-side session caching
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) {
      return null
    }

    const sessionCache: SessionCache = JSON.parse(cached)
    const now = Date.now()

    // Check if cache is expired
    if (now - sessionCache.timestamp > sessionCache.maxAge) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }

    return sessionCache.data
  } catch (error) {
    console.warn('Failed to get cached session:', error)
    return null
  }
}

/**
 * Cache session data locally for faster subsequent reads
 * Should be called after successful useSession() calls
 */
export function setCachedSession(sessionData: CachedSession | null, maxAge = DEFAULT_MAX_AGE) {
  if (typeof document === 'undefined') {
    return // SSR
  }

  try {
    if (!sessionData) {
      localStorage.removeItem(CACHE_KEY)
      return
    }

    const sessionCache: SessionCache = {
      data: sessionData,
      timestamp: Date.now(),
      maxAge
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(sessionCache))
  } catch (error) {
    console.warn('Failed to cache session:', error)
  }
}

/**
 * Clear the session cache
 */
export function clearCachedSession() {
  if (typeof document === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (error) {
    console.warn('Failed to clear cached session:', error)
  }
}

/**
 * Hook for getting session data with cookie cache fallback
 * Use this instead of useSession() for read-only session checks
 */
export function useOptimizedSession() {
  // First try to get from cookie cache (instant, no API call)
  const cookieSession = getCachedSessionFromCookie()
  
  return {
    data: cookieSession,
    isLoading: false, // Cookie reads are instant
    isPending: false
  }
}