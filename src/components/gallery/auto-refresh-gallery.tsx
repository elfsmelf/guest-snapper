'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AutoRefreshGalleryProps {
  interval?: number // Refresh interval in milliseconds, default 30 seconds
}

export function AutoRefreshGallery({ interval = 30000 }: AutoRefreshGalleryProps) {
  const router = useRouter()

  useEffect(() => {
    // Refresh on interval
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing gallery data...')
      router.refresh()
    }, interval)

    // Refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tab became visible, refreshing gallery data...')
        router.refresh()
      }
    }

    // Refresh when window gains focus
    const handleFocus = () => {
      console.log('Window gained focus, refreshing gallery data...')
      router.refresh()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(refreshInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [router, interval])

  // This component doesn't render anything
  return null
}