"use client"

import { useState, useEffect } from 'react'

interface CacheDebugProps {
  eventSlug: string
  currentGuestCanView: boolean
}

export function CacheDebugInfo({ eventSlug, currentGuestCanView }: CacheDebugProps) {
  const [debugInfo, setDebugInfo] = useState({
    timestamp: Date.now(),
    cacheHeaders: {},
    eventSlug,
    guestCanView: currentGuestCanView
  })

  useEffect(() => {
    // Update debug info when props change
    setDebugInfo(prev => ({
      ...prev,
      timestamp: Date.now(),
      guestCanView: currentGuestCanView
    }))
  }, [currentGuestCanView])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg font-mono z-50 max-w-xs">
      <div className="font-bold mb-2">🐛 Cache Debug</div>
      <div>Slug: {eventSlug}</div>
      <div>Guest Can View: {currentGuestCanView ? '✅ Yes' : '❌ No'}</div>
      <div>Timestamp: {new Date(debugInfo.timestamp).toLocaleTimeString()}</div>
      <div className="mt-2 text-yellow-300">
        Refresh page to test cache invalidation
      </div>
    </div>
  )
}