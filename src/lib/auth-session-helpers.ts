import { auth } from "@/lib/auth"
import { headers } from "next/headers"

/**
 * Get session with optimal caching strategy.
 * Uses cookie cache by default for performance, but allows fresh DB lookup when needed.
 */
export async function getSession(options?: { 
  /**
   * Force fresh database lookup, bypassing cookie cache.
   * Use this sparingly, only when you need guaranteed fresh data (e.g., after navigation).
   */
  fresh?: boolean 
}) {
  return auth.api.getSession({
    headers: await headers(),
    ...(options?.fresh && {
      query: { disableCookieCache: true }
    })
  })
}

/**
 * Get session optimized for navigation scenarios where cookie cache might be stale.
 * This is specifically for cases where client-side navigation might have outdated cache.
 */
export async function getSessionAfterNavigation() {
  return getSession({ fresh: true })
}