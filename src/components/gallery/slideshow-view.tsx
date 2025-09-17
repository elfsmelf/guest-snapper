"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  type CarouselApi 
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { SimpleQRCode } from "@/components/simple-qr-code"
import { 
  X, 
  Maximize, 
  Minimize, 
  Play, 
  Pause, 
  ArrowLeft,
  ArrowRight,
  Download
} from "lucide-react"
import Autoplay from "embla-carousel-autoplay"

interface Upload {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  caption?: string
  uploaderName?: string
  isApproved: boolean
  createdAt: string | Date
}

interface Event {
  id: string
  name: string
  coupleNames: string
  eventDate: string
  slug: string
}

interface SlideshowViewProps {
  event: Event
  uploads: Upload[]
  eventSlug: string
  slideDuration?: number
}

export function SlideshowView({ event, uploads, eventSlug, slideDuration = 5 }: SlideshowViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [api, setApi] = useState<CarouselApi>()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Filter to only approved photos and videos
  const mediaUploads = uploads.filter(upload => 
    upload.isApproved && (upload.fileType === 'image' || upload.fileType === 'video')
  )

  // Create autoplay plugin instance with current slide duration
  const autoplayPlugin = useMemo(() => 
    Autoplay({ delay: slideDuration * 1000, stopOnInteraction: false }), 
    [slideDuration]
  )

  useEffect(() => {
    if (!api) return

    // Set up slide change listener
    const onSelect = () => {
      setCurrentSlide(api.selectedScrollSnap())
    }

    api.on("select", onSelect)
    onSelect() // Set initial slide

    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error)
    }
  }

  const togglePlayPause = () => {
    if (!autoplayPlugin) return

    if (isPlaying) {
      autoplayPlugin.stop()
    } else {
      autoplayPlugin.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleDownload = (upload: Upload) => {
    // Use server-side download proxy to avoid CORS issues
    const downloadUrl = `/api/download?url=${encodeURIComponent(upload.fileUrl)}&filename=${encodeURIComponent(upload.fileName)}`

    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = upload.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const galleryUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/gallery/${eventSlug}`

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen()
          } else {
            router.push(`/gallery/${eventSlug}`)
          }
          break
        case ' ':
          e.preventDefault()
          togglePlayPause()
          break
        case 'f':
        case 'F':
          toggleFullscreen()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, router, eventSlug])

  if (mediaUploads.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No photos available</h1>
          <p className="text-gray-400 mb-6">There are no approved photos or videos to display in the slideshow.</p>
          <Button onClick={() => router.push(`/gallery/${eventSlug}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Gallery
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black ${isFullscreen ? 'h-screen' : 'min-h-screen'} overflow-hidden`}
    >
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/gallery/${eventSlug}`)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="text-white">
              <h1 className="text-lg font-semibold">{event.coupleNames}</h1>
              <p className="text-sm opacity-75">{event.name} • Slideshow</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Slideshow */}
      <Carousel
        setApi={setApi}
        plugins={[autoplayPlugin]}
        opts={{
          align: "start",
          loop: true,
        }}
        className="h-full"
      >
        <CarouselContent className="h-full">
          {mediaUploads.map((upload, index) => (
            <CarouselItem key={upload.id} className="relative h-screen">
              <div className="absolute inset-0 flex items-center justify-center">
                {upload.fileType === 'video' ? (
                  <video
                    src={upload.fileUrl}
                    className="max-w-full max-h-full object-contain"
                    controls
                    autoPlay
                    muted
                    loop
                  />
                ) : (
                  <img
                    src={upload.fileUrl}
                    alt={upload.fileName}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
                
                {/* Image Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <div className="flex items-end justify-between">
                    <div className="text-white max-w-2xl">
                      {upload.caption && (
                        <p className="text-lg mb-2">{upload.caption}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm opacity-75">
                        {upload.uploaderName && (
                          <span>by {upload.uploaderName}</span>
                        )}
                        <span>
                          {new Date(upload.createdAt).toLocaleDateString()}
                        </span>
                        <span>
                          {index + 1} of {mediaUploads.length}
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(upload)}
                      className="text-white hover:bg-white/20"
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation Arrows */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => api?.scrollPrev()}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-40"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => api?.scrollNext()}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-40"
        >
          <ArrowRight className="h-6 w-6" />
        </Button>
      </Carousel>

      {/* QR Code Overlay */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="text-center mb-2">
            <p className="text-xs font-medium text-gray-800">Scan to add photos</p>
          </div>
          <SimpleQRCode value={galleryUrl} size={80} />
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex space-x-1">
          {mediaUploads.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide 
                  ? 'bg-white' 
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}