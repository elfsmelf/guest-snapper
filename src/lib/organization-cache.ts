/**
 * Client-side organization data cache and request deduplication
 * This prevents excessive organization/list and organization/get-full-organization calls
 */

interface OrganizationData {
  id: string
  name: string
  slug: string
  members?: any[]
  invitations?: any[]
  [key: string]: any
}

interface OrganizationCache {
  data: OrganizationData | null
  timestamp: number
  maxAge: number
}

// In-memory cache for organization data
const orgCache = new Map<string, OrganizationCache>()

// Pending requests map to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<any>>()

const DEFAULT_MAX_AGE = 10 * 60 * 1000 // 10 minutes (matches server-side cache)

/**
 * Get cached organization data if available and not expired
 */
export function getCachedOrganizationData(eventId: string): OrganizationData | null {
  const cached = orgCache.get(eventId)
  if (!cached) return null

  const now = Date.now()
  if (now - cached.timestamp > cached.maxAge) {
    orgCache.delete(eventId)
    return null
  }

  return cached.data
}

/**
 * Cache organization data
 */
export function setCachedOrganizationData(
  eventId: string, 
  data: OrganizationData | null, 
  maxAge = DEFAULT_MAX_AGE
) {
  if (data) {
    orgCache.set(eventId, {
      data,
      timestamp: Date.now(),
      maxAge
    })
  } else {
    orgCache.delete(eventId)
  }
}

/**
 * Fetch organization data with deduplication and caching
 * Multiple components calling this simultaneously will share the same request
 */
export async function fetchOrganizationData(eventId: string, forceRefresh = false): Promise<{
  success: boolean
  organization?: OrganizationData
  members?: any[]
  invitations?: any[]
}> {
  // Check cache first unless forcing refresh
  if (!forceRefresh) {
    const cached = getCachedOrganizationData(eventId)
    if (cached) {
      return {
        success: true,
        organization: cached,
        members: cached.members || [],
        invitations: cached.invitations || []
      }
    }
  }

  // Check if there's already a pending request for this eventId
  const cacheKey = `org_${eventId}`
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!
  }

  // Create new request
  const requestPromise = (async () => {
    try {
      console.log('Making deduplicated organization API call for event:', eventId)
      const response = await fetch(`/api/events/${eventId}/organization`, {
        // Add cache headers to work with Vercel edge cache
        headers: {
          'Cache-Control': 'max-age=300' // 5 minutes
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch organization data')
      }

      const data = await response.json()
      
      if (data.success && data.organization) {
        // Cache the response
        setCachedOrganizationData(eventId, {
          ...data.organization,
          members: data.members,
          invitations: data.invitations
        })
      }

      return data
    } catch (error) {
      console.error('Error fetching organization data:', error)
      throw error
    } finally {
      // Remove from pending requests when done
      pendingRequests.delete(cacheKey)
    }
  })()

  // Store the pending request
  pendingRequests.set(cacheKey, requestPromise)

  return requestPromise
}

/**
 * Clear organization cache for a specific event
 */
export function clearOrganizationCache(eventId?: string) {
  if (eventId) {
    orgCache.delete(eventId)
    pendingRequests.delete(`org_${eventId}`)
  } else {
    orgCache.clear()
    pendingRequests.clear()
  }
}