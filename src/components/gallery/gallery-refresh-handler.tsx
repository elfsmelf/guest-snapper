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

    // Listen for pageshow event to detect bfcache restoration
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [router])

  return null // This component doesn't render anything
}