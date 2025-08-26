import { cache } from "react"
import { unstable_cache } from "next/cache"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

/**
 * Cached session lookup with Next.js cache tags for invalidation.
 * This prevents duplicate session calls within a single request and
 * allows proper cache invalidation on logout.
 */
const getCachedSession = cache(async (fresh: boolean = false) => {
  // Use unstable_cache with tags for server-side invalidation
  const cachedSessionLookup = unstable_cache(
    async () => {
      return auth.api.getSession({
        headers: await headers(),
        ...(fresh && {
          query: { disableCookieCache: true }
        })
      })
    },
    ['session-lookup'],
    {
      tags: ['session'],
      revalidate: fresh ? 0 : 60 // Cache for 60 seconds unless fresh
    }
  )
  
  return cachedSessionLookup()
})

/**
 * Get session with optimal caching strategy.
 * Uses cookie cache by default for performance, but allows fresh DB lookup when needed.
 * Also uses React cache() for request-level deduplication.
 */
export async function getSession(options?: { 
  /**
   * Force fresh database lookup, bypassing cookie cache.
   * Use this sparingly, only when you need guaranteed fresh data (e.g., after navigation).
   */
  fresh?: boolean 
}) {
  return getCachedSession(options?.fresh || false)
}

/**
 * Get session optimized for navigation scenarios where cookie cache might be stale.
 * This is specifically for cases where client-side navigation might have outdated cache.
 */
export async function getSessionAfterNavigation() {
  return getCachedSession(true)
}