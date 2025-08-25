'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AutoRefreshGalleryProps {
  interval?: number // Refresh interval in milliseconds, default 30 seconds
}

export function AutoRefreshGallery({ interval = 30000 }: AutoRefreshGalleryProps) {
  const router = useRouter()

  useEffect(() => {
    // Add a delay to prevent immediate refresh on page load
    const initialDelay = setTimeout(() => {
      // Refresh on interval
      const refreshInterval = setInterval(() => {
        console.log('Auto-refreshing gallery data...')
        router.refresh()
      }, interval)

      // Track if we've had at least one visibility change to prevent initial flash
      let hasHadVisibilityChange = false

      // Refresh when tab becomes visible (but not on initial load)
      const handleVisibilityChange = () => {
        if (!document.hidden && hasHadVisibilityChange) {
          console.log('Tab became visible, refreshing gallery data...')
          router.refresh()
        }
        hasHadVisibilityChange = true
      }

      // Track if we've had at least one focus event to prevent initial flash
      let hasHadFocusEvent = false

      // Refresh when window gains focus (but not on initial load)
      const handleFocus = () => {
        if (hasHadFocusEvent) {
          console.log('Window gained focus, refreshing gallery data...')
          router.refresh()
        }
        hasHadFocusEvent = true
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('focus', handleFocus)

      // Cleanup function for the delayed setup
      return () => {
        clearInterval(refreshInterval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('focus', handleFocus)
      }
    }, 2000) // Wait 2 seconds before setting up auto-refresh

    // Cleanup function for the initial timeout
    return () => {
      clearTimeout(initialDelay)
    }
  }, [router, interval])

  // This component doesn't render anything
  return null
}