import { getCookieCache } from "better-auth/cookies"
import { auth } from "./auth"
import { headers } from "next/headers"

/**
 * Get session from cookie cache first, then fallback to API if needed.
 * This dramatically reduces edge requests by reading from the cookie cache.
 */
export async function getOptimizedSession() {
  const headersList = await headers()
  
  try {
    // First, try to get session from cookie cache (no API call)
    const cachedSession = await getCookieCache(headersList)
    
    if (cachedSession) {
      console.log('Session loaded from cookie cache - no API call needed')
      return cachedSession
    }
  } catch (error) {
    console.log('Cookie cache miss, falling back to API')
  }
  
  // Fallback to API call if cookie cache is empty or expired
  // This will also refresh the cookie cache
  const session = await auth.api.getSession({
    headers: headersList
  })
  
  return session
}

/**
 * Check if user has a session cookie (for middleware)
 * This is a lightweight check that doesn't make any API calls
 */
export function hasSessionCookie(request: Request) {
  const cookieName = "session_token" // Default Better Auth session cookie
  const cookies = request.headers.get('cookie')
  return cookies?.includes(cookieName) ?? false
}