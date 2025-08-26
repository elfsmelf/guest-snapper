"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/copy-button'

interface QuickActionsClientProps {
  eventSlug: string
  galleryUrl: string
}

export function QuickActionsClient({ eventSlug, galleryUrl }: QuickActionsClientProps) {
  const router = useRouter()

  // Prefetch gallery routes on mount for instant navigation
  useEffect(() => {
    // Prefetch all gallery routes
    router.prefetch(`/gallery/${eventSlug}`)
    router.prefetch(`/gallery/${eventSlug}/upload`)
    router.prefetch(`/gallery/${eventSlug}/voice`)
    router.prefetch(`/gallery/${eventSlug}/slideshow`)
  }, [eventSlug, router])

  // Additional prefetch on hover for immediate response
  const handleMouseEnter = (path: string) => {
    router.prefetch(path)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 w-full">
      <Button 
        size="sm" 
        asChild 
        className="text-xs sm:text-sm w-full min-w-0"
        onMouseEnter={() => handleMouseEnter(`/gallery/${eventSlug}`)}
      >
        <Link href={`/gallery/${eventSlug}`} prefetch={false}>
          <Eye className="mr-1.5 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">View Gallery</span>
        </Link>
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        asChild 
        className="text-xs sm:text-sm w-full min-w-0"
        onMouseEnter={() => handleMouseEnter(`/gallery/${eventSlug}/upload`)}
      >
        <Link href={`/gallery/${eventSlug}/upload`} prefetch={false}>
          <Upload className="mr-1.5 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">Upload Photos</span>
        </Link>
      </Button>
      
      <CopyButton 
        text={galleryUrl} 
        variant="outline" 
        className="text-xs sm:text-sm w-full min-w-0 col-span-1 sm:col-span-2 md:col-span-1"
      >
        <span className="truncate">Copy Gallery Link</span>
      </CopyButton>
    </div>
  )
}