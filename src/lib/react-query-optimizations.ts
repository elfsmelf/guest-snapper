import React from 'react'
import { QueryClient, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  createOptimizedQueries,
  galleryQueryKeys,
  getOptimizedEventBySlug,
  getOptimizedUploadsByEventId,
  getOptimizedUploadCountByEventId,
  checkUserEventAccess
} from './drizzle-query-helpers'

/**
 * Optimized React Query configuration for Better Auth + Drizzle
 * Following best practices from both libraries
 */

export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Optimize for performance while maintaining data freshness
        staleTime: 2 * 60 * 1000, // 2 minutes - data stays fresh
        gcTime: 10 * 60 * 1000, // 10 minutes - cache retention (formerly cacheTime)
        retry: 3,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus for critical data
        refetchOnWindowFocus: true,
        // Network status optimizations
        networkMode: 'online',
      },
      mutations: {
        // Optimistic updates and error handling
        retry: 1,
        networkMode: 'online',
      },
    },
  })
}

/**
 * Optimized hooks using prepared statements
 */

export function useOptimizedEvent(slug: string) {
  return useQuery({
    ...createOptimizedQueries.getEvent(slug),
    enabled: !!slug,
    // Longer stale time for event data (doesn't change often)
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useOptimizedUploads(eventId: string) {
  return useQuery({
    ...createOptimizedQueries.getUploads(eventId),
    enabled: !!eventId,
    // Shorter stale time for uploads (changes frequently)
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export function useOptimizedUploadCount(eventId: string) {
  return useQuery({
    ...createOptimizedQueries.getUploadCount(eventId),
    enabled: !!eventId,
    // Very short stale time for counts (critical for UI)
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useEventAccess(eventId: string, userId: string) {
  return useQuery({
    queryKey: ['event-access', eventId, userId],
    queryFn: () => checkUserEventAccess(eventId, userId),
    enabled: !!eventId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes (access doesn't change often)
    gcTime: 15 * 60 * 1000, // 15 minutes
  })
}

/**
 * Server-side query prefetching for SSR optimization
 * Use this in your page components for optimal loading performance
 */

export async function prefetchGalleryData(queryClient: QueryClient, eventSlug: string) {
  // Prefetch event data
  await queryClient.prefetchQuery(createOptimizedQueries.getEvent(eventSlug))
  
  // Get event ID for subsequent queries
  const event = queryClient.getQueryData<any>(galleryQueryKeys.event(eventSlug))
  if (event?.id) {
    // Prefetch uploads and count in parallel
    await Promise.all([
      queryClient.prefetchQuery(createOptimizedQueries.getUploads(event.id)),
      queryClient.prefetchQuery(createOptimizedQueries.getUploadCount(event.id))
    ])
  }
}

/**
 * Mutation optimizations with optimistic updates
 */

export function useOptimisticUploadApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ uploadId, eventId, isApproved }: { 
      uploadId: string
      eventId: string 
      isApproved: boolean 
    }) => {
      const response = await fetch(`/api/uploads/${uploadId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved })
      })
      if (!response.ok) throw new Error('Failed to update approval status')
      return response.json()
    },
    // Optimistic updates for instant UI feedback
    onMutate: async ({ uploadId, eventId, isApproved }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: galleryQueryKeys.eventUploads(eventId) })
      await queryClient.cancelQueries({ queryKey: galleryQueryKeys.eventUploadCount(eventId) })

      // Snapshot previous values
      const previousUploads = queryClient.getQueryData(galleryQueryKeys.eventUploads(eventId))
      const previousCount = queryClient.getQueryData(galleryQueryKeys.eventUploadCount(eventId))

      // Optimistically update the cache
      queryClient.setQueryData(galleryQueryKeys.eventUploads(eventId), (old: any[]) => 
        old?.map(upload => 
          upload.id === uploadId 
            ? { ...upload, isApproved }
            : upload
        ) || []
      )

      // Update count if changing approval status
      if (isApproved) {
        queryClient.setQueryData(galleryQueryKeys.eventUploadCount(eventId), (old: number) => 
          (old || 0) + 1
        )
      } else {
        queryClient.setQueryData(galleryQueryKeys.eventUploadCount(eventId), (old: number) => 
          Math.max((old || 0) - 1, 0)
        )
      }

      return { previousUploads, previousCount }
    },
    // Rollback on error
    onError: (err, { eventId }, context) => {
      if (context?.previousUploads) {
        queryClient.setQueryData(galleryQueryKeys.eventUploads(eventId), context.previousUploads)
      }
      if (context?.previousCount) {
        queryClient.setQueryData(galleryQueryKeys.eventUploadCount(eventId), context.previousCount)
      }
    },
    // Always refetch after error or success
    onSettled: ({ eventId }) => {
      queryClient.invalidateQueries({ queryKey: galleryQueryKeys.eventUploads(eventId) })
      queryClient.invalidateQueries({ queryKey: galleryQueryKeys.eventUploadCount(eventId) })
    }
  })
}

/**
 * Background refetching patterns for data freshness
 */

export function useBackgroundRefresh(eventId: string, enabled = false) {
  const queryClient = useQueryClient()

  // Periodically refresh critical data in the background
  React.useEffect(() => {
    if (!enabled || !eventId) return

    const interval = setInterval(() => {
      // Refetch in the background without disturbing UI
      queryClient.refetchQueries({ 
        queryKey: galleryQueryKeys.eventUploadCount(eventId),
        type: 'active' // Only refetch currently mounted queries
      })
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [eventId, enabled, queryClient])
}

/**
 * Cache management utilities
 */

export const cacheUtils = {
  // Clear all gallery-related cache
  clearGalleryCache: (queryClient: QueryClient) => {
    queryClient.removeQueries({ queryKey: galleryQueryKeys.all })
  },

  // Preload critical data for better UX
  preloadEvent: async (queryClient: QueryClient, slug: string) => {
    await queryClient.prefetchQuery(createOptimizedQueries.getEvent(slug))
  },

  // Invalidate stale data after mutations
  invalidateEventData: (queryClient: QueryClient, eventId: string) => {
    queryClient.invalidateQueries({ queryKey: galleryQueryKeys.eventUploads(eventId) })
    queryClient.invalidateQueries({ queryKey: galleryQueryKeys.eventUploadCount(eventId) })
  }
}

/**
 * Performance monitoring hook
 */

export function useQueryPerformance() {
  const queryClient = useQueryClient()

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const cache = queryClient.getQueryCache()
      console.log(`Query cache size: ${cache.getAll().length} queries`)
      
      // Log slow queries - disabled due to type issues
      // cache.subscribe((event) => {
      //   if (event.type === 'queryUpdated' && event.query.state.dataUpdatedAt) {
      //     const duration = Date.now() - event.query.state.dataUpdatedAt
      //     if (duration > 1000) {
      //       console.warn(`Slow query detected: ${event.query.queryHash} took ${duration}ms`)
      //     }
      //   }
      // })
    }
  }, [queryClient])
}