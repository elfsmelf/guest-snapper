"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, ExternalLink, Calendar, User } from 'lucide-react'
import { toast } from 'sonner'
import { formatBytes } from '@/lib/utils'

interface Upload {
  id: string
  eventId: string
  fileName: string
  fileUrl: string
  fileType: string
  mimeType: string
  fileSize: number
  caption: string | null
  isApproved: boolean
  uploaderName: string | null
  thumbnailUrl: string | null
  width: number | null
  height: number | null
  createdAt: string
  eventName: string | null
  eventSlug: string | null
}

interface GalleryData {
  uploads: Upload[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export default function AdminGalleryPage() {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const observerTarget = useRef<HTMLDivElement>(null)

  const fetchUploads = useCallback(async (pageNum: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/gallery?page=${pageNum}&limit=50`)

      if (!response.ok) {
        throw new Error('Failed to fetch gallery')
      }

      const data: GalleryData = await response.json()

      if (pageNum === 1) {
        setUploads(data.uploads)
      } else {
        setUploads(prev => [...prev, ...data.uploads])
      }

      setHasMore(data.pagination.hasNextPage)
      setTotalCount(data.pagination.totalCount)
    } catch (error) {
      toast.error('Failed to load gallery')
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUploads(1)
  }, [fetchUploads])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, loading])

  useEffect(() => {
    if (page > 1) {
      fetchUploads(page)
    }
  }, [page, fetchUploads])

  const getMediaDisplay = (upload: Upload) => {
    if (upload.fileType === 'video') {
      return (
        <div className="relative w-full h-full bg-black group">
          <Image
            src={upload.thumbnailUrl || '/placeholder-video.png'}
            alt={upload.fileName}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
            <Play className="w-12 h-12 text-white" />
          </div>
        </div>
      )
    }

    return (
      <Image
        src={upload.fileUrl}
        alt={upload.fileName}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Gallery Photos</h1>
          <p className="text-sm text-gray-500">
            Browse all uploaded photos from all events ({totalCount.toLocaleString()} total)
          </p>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {uploads.map((upload) => (
          <div
            key={upload.id}
            className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 border hover:border-primary transition-colors"
          >
            {/* Media Display */}
            <div className="relative w-full h-full">
              {getMediaDisplay(upload)}
            </div>

            {/* Overlay with Info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                {/* Event Info */}
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs font-medium truncate">
                    {upload.eventName || 'Unknown Event'}
                  </span>
                </div>

                {/* Uploader Name */}
                {upload.uploaderName && (
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-3 h-3" />
                    <span className="text-xs truncate">{upload.uploaderName}</span>
                  </div>
                )}

                {/* File Info */}
                <div className="flex items-center justify-between text-xs">
                  <span>{formatBytes(upload.fileSize)}</span>
                  <Badge variant={upload.isApproved ? "default" : "destructive"} className="text-xs">
                    {upload.isApproved ? "Approved" : "Pending"}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => window.open(upload.fileUrl, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  {upload.eventSlug && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(`/gallery/${upload.eventSlug}`, '_blank')}
                    >
                      Event
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Intersection Observer Target */}
      <div ref={observerTarget} className="h-4" />

      {/* No More Results */}
      {!hasMore && uploads.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No more photos to load
        </div>
      )}

      {/* Empty State */}
      {!loading && uploads.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No uploads found</p>
        </div>
      )}
    </div>
  )
}
