import { cache } from "react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

/**
 * Simple session lookup with React cache() for request-level deduplication.
 * Better Auth's cookie cache handles the heavy lifting for performance.
 * 
 * This is just a thin wrapper that prevents duplicate calls within the same request.
 * Better Auth's nanostore handles client-side reactivity automatically.
 */
const getCachedSession = cache(async (fresh: boolean = false) => {
  return auth.api.getSession({
    headers: await headers(),
    ...(fresh && {
      query: { disableCookieCache: true }
    })
  })
})

/**
 * Get session leveraging Better Auth's built-in cookie cache.
 * Uses React cache() for request-level deduplication only.
 */
export async function getSession(options?: { 
  /**
   * Force fresh database lookup, bypassing Better Auth's cookie cache.
   * Use this sparingly, only when you need guaranteed fresh data.
   */
  fresh?: boolean 
}) {
  return getCachedSession(options?.fresh || false)
}

/**
 * Get session with fresh database lookup.
 * Bypasses Better Auth's cookie cache for scenarios requiring latest data.
 */
export async function getSessionAfterNavigation() {
  return getCachedSession(true)
}