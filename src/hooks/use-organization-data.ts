"use client"

import { useState, useEffect } from "react"
import { fetchOrganizationData, getCachedOrganizationData } from "@/lib/organization-cache"

interface UseOrganizationDataOptions {
  eventId?: string
  autoFetch?: boolean
  enabled?: boolean
}

interface OrganizationData {
  id: string
  name: string
  slug: string
  members?: any[]
  invitations?: any[]
  [key: string]: any
}

/**
 * Hook for lazy loading organization data only when needed.
 * Prevents automatic organization API calls on every session fetch.
 */
export function useOrganizationData({
  eventId,
  autoFetch = false,
  enabled = true
}: UseOrganizationDataOptions = {}) {
  const [data, setData] = useState<OrganizationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (forceRefresh = false) => {
    if (!eventId || !enabled) return

    setLoading(true)
    setError(null)

    try {
      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cached = getCachedOrganizationData(eventId)
        if (cached) {
          setData(cached)
          setLoading(false)
          return cached
        }
      }

      const result = await fetchOrganizationData(eventId, forceRefresh)
      
      if (result.success && result.organization) {
        setData(result.organization)
        return result.organization
      } else {
        setError("Failed to fetch organization data")
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      console.error("Organization data fetch error:", err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => fetchData(true)

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && eventId && enabled) {
      fetchData()
    }
  }, [eventId, autoFetch, enabled])

  return {
    data,
    loading,
    error,
    fetchData,
    refetch,
    // Convenience flags
    hasData: !!data,
    isEmpty: !loading && !data,
    isError: !!error
  }
}

/**
 * Hook specifically for organization members data.
 * Only fetches when explicitly called.
 */
export function useOrganizationMembers(eventId?: string) {
  const { data, loading, error, fetchData, refetch } = useOrganizationData({
    eventId,
    autoFetch: false
  })

  return {
    members: data?.members || [],
    invitations: data?.invitations || [],
    loading,
    error,
    fetchMembers: () => fetchData(),
    refetch,
    hasMembers: (data?.members?.length || 0) > 0,
    hasInvitations: (data?.invitations?.length || 0) > 0
  }
}