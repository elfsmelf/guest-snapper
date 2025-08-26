"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function GalleryRefreshHandler() {
  const router = useRouter()

  useEffect(() => {
    // Handle browser back/forward cache (bfcache) restoration
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was restored from bfcache (browser back button)
        // Refresh to show any new uploads that may have been added
        console.log('🔄 Gallery restored from bfcache, refreshing...')
        router.refresh()
      }
    }

    // Handle visibility change to refresh when tab becomes visible
    // This ensures fresh data when user switches back to the tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Tab became visible, refreshing gallery data...')
        router.refresh()
      }
    }

    // Handle focus events to ensure fresh data
    const handleFocus = () => {
      console.log('🔄 Window focused, refreshing gallery data...')
      router.refresh()
    }

    // Listen for various events that should trigger refresh
    window.addEventListener('pageshow', handlePageShow)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [router])

  return null // This component doesn't render anything
}