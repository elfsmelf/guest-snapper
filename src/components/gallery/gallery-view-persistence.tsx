"use client"

import { useEffect } from 'react'
import { useQueryState } from 'nuqs'
import { usePathname } from 'next/navigation'

/**
 * Client-side component to handle view=public parameter persistence
 * across gallery navigation using nuqs (much cleaner than middleware approach)
 */
export function GalleryViewPersistence() {
  const pathname = usePathname()
  const [view, setView] = useQueryState('view', {
    history: 'replace' // Use replace to avoid cluttering history
  })

  useEffect(() => {
    // Only run on gallery routes
    if (!pathname.startsWith('/gallery/')) return

    // Check if we should persist view=public from previous navigation
    if (!view && typeof window !== 'undefined') {
      const referrer = document.referrer
      
      if (referrer) {
        try {
          const referrerUrl = new URL(referrer)
          const referrerView = referrerUrl.searchParams.get('view')
          
          // If navigating from another gallery page with view=public, persist it
          if (referrerView === 'public' && 
              referrerUrl.pathname.startsWith('/gallery/') &&
              referrerUrl.hostname === window.location.hostname) {
            void setView('public')
          }
        } catch (e) {
          // Invalid referrer URL, ignore
        }
      }
    }
  }, [pathname, view, setView])

  // This component doesn't render anything
  return null
}