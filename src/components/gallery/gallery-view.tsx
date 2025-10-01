"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { GalleryLink } from "./gallery-link"
import { CloudflareImage } from "@/components/ui/cloudflare-image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Camera,
  MessageSquare,
  Mic,
  Heart,
  Download,
  Share2,
  Search,
  User,
  Calendar,
  Info,
  Play,
  Check,
  X,
  ChevronDown,
  Upload,
  Loader2,
  Eye,
  EyeOff,
  FolderPlus,
  CheckSquare,
  Square,
  MoreHorizontal
} from "lucide-react"
import { ImageViewer } from "./image-viewer"
import { MessageDialog } from "./message-dialog"
import Masonry from 'react-masonry-css'
import { GuestbookEntries } from "./guestbook-entries"
import { AudioPlayer } from "./audio-player"
import { toast } from "sonner"
import { approveUpload, rejectUpload, bulkMoveToAlbum, bulkHideImages, hideImage } from "@/app/actions/upload"
import { parseLocalDate } from "@/lib/date-utils"

interface Event {
  id: string
  name: string
  coupleNames: string
  eventDate: string
  slug: string
  themeId: string
  uploadWindowEnd: string
  downloadWindowEnd: string
  privacySettings: string
  moderationSettings: string
  coverImageUrl?: string
  guestCanViewAlbum: boolean
  guestCanViewGuestbook: boolean
  guestCanViewAudioMessages: boolean
  approveUploads: boolean
  userId: string
  albums: { id: string; name: string; sortOrder: number; isVisible: boolean }[]
  uploadsCount: number
  approvedUploadsCount: number
  guestbookCount: number
  [key: string]: any // Allow extra properties from database
}

interface Upload {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  caption?: string
  uploaderName?: string
  isApproved: boolean
  createdAt: string | Date
  albumId?: string | null
  [key: string]: any // Allow extra properties from database
}

type UIMode = 'GUEST_UI' | 'OWNER_UI' | 'AUTH_UI'

interface GalleryViewProps {
  event: Event
  uploads: Upload[]
  pendingUploads?: Upload[]
  eventSlug: string
  isOwner?: boolean
  hasEventAccess?: boolean
  continuationCard?: React.ReactNode
  forcePublicView?: boolean
  guestbookEntries?: any[]
  isGuestOwnContent?: boolean
  uiMode?: UIMode
}

export function GalleryView({ event, uploads, pendingUploads = [], eventSlug, isOwner = false, hasEventAccess = false, continuationCard, forcePublicView = false, guestbookEntries = [], isGuestOwnContent = false, uiMode = 'GUEST_UI' }: GalleryViewProps) {

  const [selectedTab, setSelectedTab] = useState<'photos' | 'audio' | 'guestbook' | 'pending'>('photos')
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null)

  // Parse privacy settings to determine if guest downloads are allowed
  const getPrivacySettings = () => {
    try {
      return event.privacySettings ? JSON.parse(event.privacySettings) : {}
    } catch {
      return {}
    }
  }

  const privacySettings = getPrivacySettings()
  const allowGuestDownloads = privacySettings.allow_guest_downloads ?? false
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [guestbookCount, setGuestbookCount] = useState(event.guestbookCount)

  // Image selection state for bulk actions
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [showAlbumModal, setShowAlbumModal] = useState(false)

  // Optimistic updates state
  const [optimisticActions, setOptimisticActions] = useState<Map<string, 'approving' | 'rejecting' | 'approved' | 'rejected'>>(new Map())

  // Optimistic hide state - tracks which images are being hidden or have been hidden
  const [hiddenImages, setHiddenImages] = useState<Set<string>>(new Set())
  
  const router = useRouter()

  // Derive display data from props + optimistic actions
  const displayPendingUploads = pendingUploads.filter(upload => {
    const action = optimisticActions.get(upload.id)
    return !action || action === 'approving' || action === 'rejecting'
  })
  
  const displayApprovedUploads = [
    ...uploads,
    ...pendingUploads.filter(upload => optimisticActions.get(upload.id) === 'approved')
  ]

  // Check if upload window is open
  const uploadWindowOpen = event.activationDate ?
    new Date() >= parseLocalDate(event.activationDate) &&
    new Date() <= new Date(event.uploadWindowEnd || event.activationDate)
    : true
  
  // Removed dynamic theming for simplicity
  
  // Masonry layout handles responsive columns automatically

  const handleMessageAdded = () => {
    setGuestbookCount(prev => prev + 1)
  }

  // Image selection helpers
  const toggleImageSelection = (uploadId: string) => {
    setSelectedImages(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(uploadId)) {
        newSelection.delete(uploadId)
      } else {
        newSelection.add(uploadId)
      }
      return newSelection
    })
  }

  const selectAllImages = () => {
    const allImageIds = new Set(displayUploads.map(upload => upload.id))
    setSelectedImages(allImageIds)
  }

  const clearSelection = () => {
    setSelectedImages(new Set())
    setSelectionMode(false)
  }

  const handleBulkHideImages = async () => {
    if (selectedImages.size === 0) return

    const uploadIds = Array.from(selectedImages)

    // Optimistically hide images immediately
    setHiddenImages(prev => {
      const newHidden = new Set(prev)
      uploadIds.forEach(id => newHidden.add(id))
      return newHidden
    })

    toast.loading(`Hiding ${selectedImages.size} image(s)...`)

    const result = await bulkHideImages(uploadIds)

    if (result.success) {
      toast.dismiss()
      toast.success(result.message || `${selectedImages.size} image(s) hidden successfully`)
    } else {
      toast.dismiss()
      toast.error(result.error || 'Failed to hide images')

      // Revert optimistic update on error
      setHiddenImages(prev => {
        const newHidden = new Set(prev)
        uploadIds.forEach(id => newHidden.delete(id))
        return newHidden
      })
    }

    clearSelection()
  }

  const handleBulkMoveToAlbum = async (albumId: string) => {
    if (selectedImages.size === 0) return

    const uploadIds = Array.from(selectedImages)

    // Optimistic update: immediately update local state
    const albumName = albumId ?
      event.albums.find(a => a.id === albumId)?.name || 'Album' :
      'All Photos'

    toast.loading(`Moving ${selectedImages.size} image(s) to ${albumName}...`)

    const result = await bulkMoveToAlbum(uploadIds, albumId || null)

    if (result.success) {
      toast.dismiss()
      toast.success(`${result.count} image(s) moved to ${albumName}`)

      // Force page refresh to show updated data
      router.refresh()
    } else {
      toast.dismiss()
      toast.error(result.error || 'Failed to move images')
    }

    setShowAlbumModal(false)
    clearSelection()
  }


  // Filter approved uploads for photos tab (exclude audio)
  const filteredUploads = selectedTab === 'photos' ? displayApprovedUploads.filter(upload => {
    const isPhotoOrVideo = upload.fileType === 'image' || upload.fileType === 'video'
    const matchesSearch = searchQuery === '' ||
      upload.uploaderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.caption?.toLowerCase().includes(searchQuery.toLowerCase())

    // Check if image is in Hidden Images album (already hidden on server)
    const hiddenAlbum = event.albums.find(a => a.name === 'Hidden Images')
    const isInHiddenAlbum = hiddenAlbum && upload.albumId === hiddenAlbum.id

    // Handle optimistically hidden images
    const isHiddenOptimistically = hiddenImages.has(upload.id)
    const isViewingHiddenAlbum = selectedAlbum && event.albums.find(a => a.id === selectedAlbum)?.name === 'Hidden Images'

    // If viewing Hidden Images album, only show hidden images (optimistic + server-side)
    if (isViewingHiddenAlbum) {
      return isPhotoOrVideo && matchesSearch && (isHiddenOptimistically || isInHiddenAlbum)
    }

    // For all other views (including "All photos"), exclude hidden images
    if (isHiddenOptimistically || isInHiddenAlbum) {
      return false
    }

    // Album filtering (after excluding hidden images)
    const matchesAlbum = selectedAlbum === 'all' ||
      (selectedAlbum === 'unassigned' && !upload.albumId) ||
      upload.albumId === selectedAlbum

    return isPhotoOrVideo && matchesSearch && matchesAlbum
  }) : []

  // Filter audio uploads for audio tab
  const filteredAudioUploads = selectedTab === 'audio' ? displayApprovedUploads.filter(upload => {
    const isAudio = upload.fileType === 'audio'
    const matchesSearch = searchQuery === '' || 
      upload.uploaderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.caption?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return isAudio && matchesSearch
  }) : []

  // Filter pending uploads for pending tab (exclude audio)
  const filteredPendingUploads = selectedTab === 'pending' && uiMode === 'OWNER_UI' ? displayPendingUploads.filter(upload => {
    const isPhotoOrVideo = upload.fileType === 'image' || upload.fileType === 'video'
    const matchesSearch = searchQuery === '' ||
      upload.uploaderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.caption?.toLowerCase().includes(searchQuery.toLowerCase())

    // Check if image is in Hidden Images album (already hidden on server)
    const hiddenAlbum = event.albums.find(a => a.name === 'Hidden Images')
    const isInHiddenAlbum = hiddenAlbum && upload.albumId === hiddenAlbum.id

    // Handle optimistically hidden images
    const isHiddenOptimistically = hiddenImages.has(upload.id)
    const isViewingHiddenAlbum = selectedAlbum && event.albums.find(a => a.id === selectedAlbum)?.name === 'Hidden Images'

    // If viewing Hidden Images album, only show hidden images (optimistic + server-side)
    if (isViewingHiddenAlbum) {
      return isPhotoOrVideo && matchesSearch && (isHiddenOptimistically || isInHiddenAlbum)
    }

    // For all other views (including "All photos"), exclude hidden images
    if (isHiddenOptimistically || isInHiddenAlbum) {
      return false
    }

    // Album filtering (after excluding hidden images)
    const matchesAlbum = selectedAlbum === 'all' ||
      (selectedAlbum === 'unassigned' && !upload.albumId) ||
      upload.albumId === selectedAlbum

    return isPhotoOrVideo && matchesSearch && matchesAlbum
  }) : []

  // Filter pending audio uploads for pending tab
  const filteredPendingAudioUploads = selectedTab === 'pending' && uiMode === 'OWNER_UI' ? displayPendingUploads.filter(upload => {
    const isAudio = upload.fileType === 'audio'
    const matchesSearch = searchQuery === '' || 
      upload.uploaderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.caption?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return isAudio && matchesSearch
  }) : []

  // Choose which uploads to display
  const displayUploads = selectedTab === 'pending' ? filteredPendingUploads : filteredUploads
  const displayAudioUploads = selectedTab === 'pending' ? filteredPendingAudioUploads : filteredAudioUploads

  // Calculate counts (excluding hidden images)
  const hiddenAlbum = event.albums.find(a => a.name === 'Hidden Images')

  const pendingPhotoCount = displayPendingUploads.filter(u => {
    const isPhotoOrVideo = u.fileType === 'image' || u.fileType === 'video'
    const isInHiddenAlbum = hiddenAlbum && u.albumId === hiddenAlbum.id
    const isHiddenOptimistically = hiddenImages.has(u.id)
    return isPhotoOrVideo && !isInHiddenAlbum && !isHiddenOptimistically
  }).length

  const pendingAudioCount = displayPendingUploads.filter(u => u.fileType === 'audio').length

  const approvedPhotoCount = displayApprovedUploads.filter(u => {
    const isPhotoOrVideo = u.fileType === 'image' || u.fileType === 'video'
    const isInHiddenAlbum = hiddenAlbum && u.albumId === hiddenAlbum.id
    const isHiddenOptimistically = hiddenImages.has(u.id)
    return isPhotoOrVideo && !isInHiddenAlbum && !isHiddenOptimistically
  }).length

  const approvedAudioCount = displayApprovedUploads.filter(u => u.fileType === 'audio').length

  const openImageModal = (upload: Upload) => {
    setSelectedUpload(upload)
  }

  const closeImageModal = () => {
    setSelectedUpload(null)
  }

  const handleApprove = async (uploadId: string) => {
    // Optimistic update - immediately show as approving
    setOptimisticActions(prev => new Map(prev.set(uploadId, 'approving')))
    
    try {
      const result = await approveUpload(uploadId)
      
      if (result.success) {
        // Show as approved and remove from pending
        setOptimisticActions(prev => new Map(prev.set(uploadId, 'approved')))
        toast.success('Upload approved successfully')
        
        // Data will be updated via optimistic state - no refresh needed
      } else {
        // Revert optimistic update on error
        setOptimisticActions(prev => {
          const newMap = new Map(prev)
          newMap.delete(uploadId)
          return newMap
        })
        toast.error(result.error || 'Failed to approve upload')
      }
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticActions(prev => {
        const newMap = new Map(prev)
        newMap.delete(uploadId)
        return newMap
      })
      toast.error('Failed to approve upload')
    }
  }

  const handleReject = async (uploadId: string) => {
    // Optimistic update - immediately show as rejecting
    setOptimisticActions(prev => new Map(prev.set(uploadId, 'rejecting')))
    
    try {
      const result = await rejectUpload(uploadId)
      
      if (result.success) {
        // Show as rejected and remove from pending
        setOptimisticActions(prev => new Map(prev.set(uploadId, 'rejected')))
        toast.success('Upload rejected')
        
        // Data will be updated via optimistic state - no refresh needed
      } else {
        // Revert optimistic update on error
        setOptimisticActions(prev => {
          const newMap = new Map(prev)
          newMap.delete(uploadId)
          return newMap
        })
        toast.error(result.error || 'Failed to reject upload')
      }
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticActions(prev => {
        const newMap = new Map(prev)
        newMap.delete(uploadId)
        return newMap
      })
      toast.error('Failed to reject upload')
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background Image Hero Section - 70vh */}
      {event.coverImageUrl && (
        <div className="h-[70vh] relative overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('${event.coverImageUrl}')`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/50" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 py-16">
            <div className="flex flex-col items-center text-center max-w-md mx-auto">
              {/* Names */}
              <div className="mb-6">
                {(() => {
                  const names =
                    event.coupleNames.split(" & ").length > 1
                      ? event.coupleNames.split(" & ")
                      : event.coupleNames.split(" and ").length > 1
                        ? event.coupleNames.split(" and ")
                        : [event.coupleNames]

                  return names.length > 1 ? (
                    <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight tracking-tight drop-shadow-2xl gallery-serif">
                      {names[0].trim()} & {names[1].trim()}
                    </h1>
                  ) : (
                    <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight tracking-tight drop-shadow-2xl gallery-serif">
                      {names[0].trim()}
                    </h1>
                  )
                })()}
              </div>

              {/* Date */}
              <p className="text-lg md:text-xl text-white/90 mb-12 tracking-wide drop-shadow-lg gallery-serif">
                {parseLocalDate(event.eventDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button asChild size="lg" className="bg-primary/90 backdrop-blur-sm text-primary-foreground hover:bg-primary transition-all duration-300 h-14 text-base font-medium rounded-lg shadow-xl border border-white/20">
                  <Link href={`/gallery/${eventSlug}/upload`} prefetch={false}>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Media
                  </Link>
                </Button>

                <Button
                  size="lg"
                  className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-300 h-14 text-base font-medium rounded-lg shadow-xl"
                  onClick={() => setIsMessageDialogOpen(true)}
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Leave a Message
                </Button>

                <Button asChild size="lg" className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-300 h-14 text-base font-medium rounded-lg shadow-xl">
                  <Link href={`/gallery/${eventSlug}/voice`} prefetch={false}>
                    <Mic className="w-5 h-5 mr-2" />
                    Leave a Voicemail
                  </Link>
                </Button>
              </div>
            </div>

            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="flex flex-col items-center text-white/80">
                <p className="text-sm font-medium mb-2 tracking-wide">Scroll to Live Feed</p>
                <ChevronDown className="w-5 h-5 animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      )}


      {!event.coverImageUrl && (
        <div className="h-[70vh] relative overflow-hidden bg-gradient-to-br from-background via-muted to-secondary/20">
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 py-16">
            <div className="flex flex-col items-center text-center max-w-md mx-auto">
              {/* Names */}
              <div className="mb-6">
                {(() => {
                  const names =
                    event.coupleNames.split(" & ").length > 1
                      ? event.coupleNames.split(" & ")
                      : event.coupleNames.split(" and ").length > 1
                        ? event.coupleNames.split(" and ")
                        : [event.coupleNames]

                  return names.length > 1 ? (
                    <h1 className="text-4xl md:text-6xl font-bold leading-tight text-foreground tracking-tight gallery-serif">
                      {names[0].trim()} & {names[1].trim()}
                    </h1>
                  ) : (
                    <h1 className="text-4xl md:text-6xl font-bold leading-tight text-foreground tracking-tight gallery-serif">
                      {names[0].trim()}
                    </h1>
                  )
                })()}
              </div>

              {/* Date */}
              <p className="text-lg md:text-xl mb-12 tracking-wide text-muted-foreground gallery-serif">
                {parseLocalDate(event.eventDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 h-14 text-base font-medium rounded-lg shadow-lg">
                  <Link href={`/gallery/${eventSlug}/upload`} prefetch={false}>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Media
                  </Link>
                </Button>

                <Button
                  size="lg"
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all duration-300 h-14 text-base font-medium rounded-lg shadow-lg"
                  onClick={() => setIsMessageDialogOpen(true)}
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Leave a Message
                </Button>

                <Button asChild size="lg" className="border-2 border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300 h-14 text-base font-medium rounded-lg shadow-lg bg-card/50">
                  <Link href={`/gallery/${eventSlug}/voice`} prefetch={false}>
                    <Mic className="w-5 h-5 mr-2" />
                    Leave a Voicemail
                  </Link>
                </Button>
              </div>
            </div>

            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="flex flex-col items-center text-muted-foreground">
                <p className="text-sm font-medium mb-2 tracking-wide">Scroll to Live Feed</p>
                <ChevronDown className="w-5 h-5 animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Continuation Card */}
      {continuationCard && (
        <div className="px-4 py-6 bg-background border-b">
          {continuationCard}
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 min-h-screen bg-background">
        <>
          {/* Tabs */}
            <Tabs value={selectedTab} onValueChange={(value) => {
              if (value === 'guestbook') {
                setSelectedTab('guestbook')
              } else if (value === 'pending') {
                setSelectedTab('pending')
                setSelectedAlbum('all')
              } else if (value === 'audio') {
                setSelectedTab('audio')
              } else {
                setSelectedTab('photos')
                setSelectedAlbum('all')
              }
            }} className="mb-4">
              <TabsList className="w-full justify-start bg-muted overflow-x-auto flex-nowrap scrollbar-hide">
                <TabsTrigger value="photos" className="data-[state=active]:bg-background flex-shrink-0">
                  Photos ({approvedPhotoCount})
                </TabsTrigger>
                {(uiMode === 'OWNER_UI' || event.guestCanViewAudioMessages) && (
                  <TabsTrigger value="audio" className="data-[state=active]:bg-background flex-shrink-0">
                    Audio Messages ({approvedAudioCount})
                  </TabsTrigger>
                )}
                {uiMode === 'OWNER_UI' && event.approveUploads && (
                  <TabsTrigger value="pending" className="data-[state=active]:bg-background flex-shrink-0">
                    Pending ({pendingPhotoCount + pendingAudioCount})
                  </TabsTrigger>
                )}
                {(uiMode === 'OWNER_UI' || event.guestCanViewGuestbook) && (
                  <TabsTrigger value="guestbook" className="data-[state=active]:bg-background flex-shrink-0">
                    Messages ({guestbookCount})
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>

            {/* Guest Own Content Notice */}
            {isGuestOwnContent && (
              <Alert className="mb-4 bg-primary/5 border-primary/20">
                <Heart className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <strong>Your Memories:</strong> This shows only the photos and messages you've shared. The gallery is currently private, but your contributions are safely stored and the hosts can see them. Keep uploading more memories!
                </AlertDescription>
              </Alert>
            )}

            {/* Upload Review Notice */}
            {event.approveUploads && selectedTab === 'photos' && !isGuestOwnContent && (
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Upload Review:</strong> Photos and videos you upload may take some time to appear in the gallery as the host reviews all uploads before they are published.
                </AlertDescription>
              </Alert>
            )}

            {selectedTab === 'audio' ? (
              <div>
                {/* Check audio messages viewing permission */}
                {(uiMode === 'OWNER_UI' || event.guestCanViewAudioMessages) ? (
                  <>
                    {/* Audio Messages List */}
                    <div className="space-y-4">
                      {displayAudioUploads.map((upload) => (
                        <AudioPlayer
                          key={upload.id}
                          upload={upload}
                          onApprove={undefined}
                          onReject={undefined}
                          showApprovalButtons={false}
                        />
                      ))}
                    </div>

                    {displayAudioUploads.length === 0 && (
                      <div className="text-center py-12">
                        <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No audio messages yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Be the first to share an audio message from this event!
                        </p>
                        {uploadWindowOpen && (
                          <Button onClick={() => {
                            window.location.href = `/gallery/${eventSlug}/voice`
                          }}>
                            <Mic className="h-4 w-4 mr-2" />
                            Record Audio Message
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Audio Messages Hidden</h3>
                    <p className="text-muted-foreground">
                      The event host has chosen to keep audio messages private.
                    </p>
                  </div>
                )}
              </div>
            ) : selectedTab === 'photos' || selectedTab === 'pending' ? (
              <div>
                {/* Album Filter Tabs */}
                {event.albums.filter((album) => {
                  // For public users, hide Hidden Images album and only show visible albums
                  if (uiMode === 'GUEST_UI') {
                    return album.name !== 'Hidden Images' && album.isVisible !== false
                  }
                  // For owners/members, show all albums including Hidden
                  return true
                }).length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Filter by Album:</span>
                      {event.albums.some((album) => album.isVisible === false) && uiMode === 'OWNER_UI' && (
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          Some albums are hidden from guests
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedAlbum === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedAlbum('all')}
                      >
                        All Photos {!isGuestOwnContent && `(${selectedTab === 'pending' ? pendingPhotoCount : approvedPhotoCount})`}
                      </Button>
                      <Button
                        variant={selectedAlbum === 'unassigned' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedAlbum('unassigned')}
                      >
                        Unassigned {!isGuestOwnContent && `(${selectedTab === 'pending'
                          ? pendingUploads.filter(u => {
                              const isPhotoOrVideo = u.fileType === 'image' || u.fileType === 'video'
                              const isUnassigned = !u.albumId
                              const isHiddenOptimistically = hiddenImages.has(u.id)
                              return isPhotoOrVideo && isUnassigned && !isHiddenOptimistically
                            }).length
                          : uploads.filter(u => {
                              const isPhotoOrVideo = u.fileType === 'image' || u.fileType === 'video'
                              const isUnassigned = !u.albumId
                              const isInHiddenAlbum = hiddenAlbum && u.albumId === hiddenAlbum.id
                              const isHiddenOptimistically = hiddenImages.has(u.id)
                              return isPhotoOrVideo && isUnassigned && !isInHiddenAlbum && !isHiddenOptimistically
                            }).length
                        })`}
                      </Button>
                      {event.albums.filter((album) => {
                        // For public users, hide Hidden Images album and only show visible albums
                        if (uiMode === 'GUEST_UI') {
                          return album.name !== 'Hidden Images' && album.isVisible !== false
                        }
                        // For owners/members, show all albums including Hidden
                        return true
                      }).map((album) => {
                        // Calculate album uploads with optimistic updates
                        let albumUploads = selectedTab === 'pending'
                          ? pendingUploads.filter(u => (u.fileType === 'image' || u.fileType === 'video') && u.albumId === album.id)
                          : uploads.filter(u => (u.fileType === 'image' || u.fileType === 'video') && u.albumId === album.id)

                        // For Hidden Images album, add optimistically hidden images
                        if (album.name === 'Hidden Images') {
                          const hiddenUploads = (selectedTab === 'pending' ? pendingUploads : uploads)
                            .filter(u =>
                              (u.fileType === 'image' || u.fileType === 'video') &&
                              hiddenImages.has(u.id)
                            )
                          albumUploads = [...albumUploads, ...hiddenUploads]
                        } else {
                          // For other albums, remove optimistically hidden images
                          albumUploads = albumUploads.filter(u => !hiddenImages.has(u.id))
                        }
                        return (
                          <Button
                            key={album.id}
                            variant={selectedAlbum === album.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedAlbum(album.id)}
                            className={album.name === 'Hidden Images' ? 'border-orange-300 text-orange-700' : ''}
                          >
                            {album.name === 'Hidden Images' && <EyeOff className="h-3 w-3 mr-1" />}
                            {album.name} {!isGuestOwnContent && `(${albumUploads.length})`}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                {/* Filters and Search */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search photos by name or caption..."
                        className="pl-10"
                      />
                    </div>
                  </div>

                </div>

                {/* Bulk Actions for Owners/Members */}
                {(uiMode === 'OWNER_UI' || uiMode === 'AUTH_UI') && displayUploads.length > 0 && (
                  <div className="flex items-center justify-between mb-4 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      {!selectionMode ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectionMode(true)}
                        >
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Select Images
                        </Button>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={selectAllImages}
                            >
                              Select All ({displayUploads.length})
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearSelection}
                            >
                              Cancel
                            </Button>
                          </div>

                          {selectedImages.size > 0 && (
                            <div className="flex items-center gap-2 ml-4">
                              <span className="text-sm font-medium">
                                {selectedImages.size} selected
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkHideImages}
                              >
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide Images
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAlbumModal(true)}
                              >
                                <FolderPlus className="h-4 w-4 mr-2" />
                                Move to Album
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Photo Masonry Grid */}
                <Masonry
                  breakpointCols={{
                    default: 4,
                    1280: 4,
                    1024: 3,
                    640: 2
                  }}
                  className="flex -ml-3 w-auto"
                  columnClassName="pl-3 bg-clip-padding"
                >
                  {displayUploads.map((upload) => {
                    const isSelected = selectedImages.has(upload.id)

                    return (
                    <div
                      key={upload.id}
                      className={`relative cursor-pointer group overflow-hidden rounded-lg mb-3 transition-all duration-200 ${
                        isSelected ? 'ring-4 ring-primary ring-opacity-70' : ''
                      }`}
                      onClick={(e) => {
                        if (selectionMode) {
                          e.stopPropagation()
                          toggleImageSelection(upload.id)
                        } else {
                          openImageModal(upload)
                        }
                      }}
                    >
                      {/* Show thumbnail for videos if available, otherwise show video with poster */}
                      {upload.fileType === 'video' && upload.thumbnailUrl ? (
                        <CloudflareImage
                          src={upload.thumbnailUrl}
                          alt={upload.fileName}
                          width={600}
                          height={800}
                          className="w-full h-auto transition-transform duration-300 group-hover:scale-105 rounded-lg"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                          style={{ height: 'auto' }}
                          loading="lazy"
                        />
                      ) : upload.fileType === 'video' ? (
                        <div className="relative w-full" style={{ paddingBottom: '133%' }}>
                          <video
                            src={upload.fileUrl}
                            muted
                            playsInline
                            preload="metadata"
                            className="absolute inset-0 w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      ) : (
                        <CloudflareImage
                          src={upload.fileUrl}
                          alt={upload.fileName}
                          width={600}
                          height={800}
                          className="w-full h-auto transition-transform duration-300 group-hover:scale-105 rounded-lg"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                          style={{ height: 'auto' }}
                          loading="lazy"
                        />
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

                      {/* Video play button and duration badge */}
                      {upload.fileType === 'video' && (
                        <>
                          {/* Play button overlay */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
                            </div>
                          </div>
                          {/* Duration badge */}
                          {upload.duration && (
                            <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                              {Math.floor(upload.duration / 60)}:{(upload.duration % 60).toString().padStart(2, '0')}
                            </div>
                          )}
                        </>
                      )}

                      {/* Approval buttons for pending tab */}
                      {selectedTab === 'pending' && uiMode === 'OWNER_UI' && (() => {
                        const action = optimisticActions.get(upload.id)
                        const isProcessing = action === 'approving' || action === 'rejecting'

                        return (
                          <div className="absolute top-2 left-2 flex gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 disabled:opacity-50"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleApprove(upload.id)
                              }}
                              disabled={isProcessing}
                              title={action === 'approving' ? 'Approving...' : 'Approve'}
                            >
                              {action === 'approving' ?
                                <Loader2 className="h-4 w-4 animate-spin" /> :
                                <Check className="h-4 w-4" />
                              }
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 w-8 p-0 disabled:opacity-50"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleReject(upload.id)
                              }}
                              disabled={isProcessing}
                              title={action === 'rejecting' ? 'Rejecting...' : 'Reject'}
                            >
                              {action === 'rejecting' ?
                                <Loader2 className="h-4 w-4 animate-spin" /> :
                                <X className="h-4 w-4" />
                              }
                            </Button>
                          </div>
                        )
                      })()}

                      {/* Selection and action buttons for owners/members */}
                      {(uiMode === 'OWNER_UI' || uiMode === 'AUTH_UI') && selectedTab !== 'pending' && (
                        <>
                          {/* Selection checkbox */}
                          {selectionMode && (
                            <div className="absolute top-2 left-2">
                              <Button
                                size="sm"
                                variant={isSelected ? "default" : "secondary"}
                                className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-black border-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleImageSelection(upload.id)
                                }}
                              >
                                {isSelected ?
                                  <CheckSquare className="h-4 w-4" /> :
                                  <Square className="h-4 w-4" />
                                }
                              </Button>
                            </div>
                          )}

                          {/* Individual action buttons - only show when not in selection mode */}
                          {!selectionMode && (
                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-black border-0"
                                onClick={async (e) => {
                                  e.stopPropagation()

                                  // Optimistically hide image immediately
                                  setHiddenImages(prev => new Set(prev).add(upload.id))

                                  toast.loading('Hiding image...')
                                  const result = await hideImage(upload.id)

                                  if (result.success) {
                                    toast.dismiss()
                                    toast.success(result.message || 'Image hidden successfully')
                                  } else {
                                    toast.dismiss()
                                    toast.error(result.error || 'Failed to hide image')

                                    // Revert optimistic update on error
                                    setHiddenImages(prev => {
                                      const newHidden = new Set(prev)
                                      newHidden.delete(upload.id)
                                      return newHidden
                                    })
                                  }
                                }}
                                title="Hide image"
                              >
                                <EyeOff className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-black border-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedImages(new Set([upload.id]))
                                  setShowAlbumModal(true)
                                }}
                                title="Move to album"
                              >
                                <FolderPlus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </>
                      )}

                      {/* Name overlay at bottom */}
                      {upload.uploaderName && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <p className="text-white text-sm font-medium truncate">
                            {upload.uploaderName}
                          </p>
                        </div>
                      )}
                    </div>
                    )
                  })}
                </Masonry>

                {/* Pending Audio Messages */}
                {selectedTab === 'pending' && displayAudioUploads.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <Mic className="h-5 w-5" />
                      Pending Audio Messages ({displayAudioUploads.length})
                    </h3>
                    <div className="space-y-4">
                      {displayAudioUploads.map((upload) => (
                        <AudioPlayer
                          key={upload.id}
                          upload={upload}
                          onApprove={handleApprove}
                          onReject={handleReject}
                          showApprovalButtons={true}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {displayUploads.length === 0 && displayAudioUploads.length === 0 && (
                  <div className="text-center py-12">
                    <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {selectedTab === 'pending' 
                        ? 'No pending uploads' 
                        : isGuestOwnContent 
                        ? 'Start sharing your memories!' 
                        : 'No photos yet'
                      }
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {selectedTab === 'pending' 
                        ? 'All uploads have been reviewed.' 
                        : isGuestOwnContent
                        ? 'Upload your favorite photos and moments from this special event. Your memories matter!'
                        : 'Be the first to share a photo from this event!'
                      }
                    </p>
                    {uploadWindowOpen && selectedTab !== 'pending' && (
                      <Button onClick={() => {
                        window.location.href = `/gallery/${eventSlug}/upload`
                      }}>
                        <Camera className="h-4 w-4 mr-2" />
                        {isGuestOwnContent ? 'Share Your Photos' : 'Upload Photos'}
                      </Button>
                    )}
                  </div>
                )}

                {displayUploads.length === 0 && displayAudioUploads.length > 0 && selectedTab === 'pending' && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No pending photos or videos.</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Check guestbook viewing permission */}
                {(uiMode === 'OWNER_UI' || event.guestCanViewGuestbook) ? (
                  <GuestbookEntries
                    eventId={event.id}
                    onMessageAdded={handleMessageAdded}
                    customEntries={isGuestOwnContent ? guestbookEntries : undefined}
                  />
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Guestbook Messages Hidden</h3>
                    <p className="text-muted-foreground">
                      The event host has chosen to keep guestbook messages private.
                    </p>
                  </div>
                )}
              </div>
            )}
        </>
      </div>

      {/* Image Viewer Modal */}
      <ImageViewer
        upload={selectedUpload}
        isOpen={selectedUpload !== null}
        onClose={closeImageModal}
        allowGuestDownloads={allowGuestDownloads}
      />

      {/* Message Dialog */}
      <MessageDialog
        eventId={event.id}
        eventName={event.name}
        isOpen={isMessageDialogOpen}
        onClose={() => setIsMessageDialogOpen(false)}
        onMessageAdded={handleMessageAdded}
      />

      {/* Album Selection Modal */}
      <Dialog open={showAlbumModal} onOpenChange={setShowAlbumModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move Images to Album</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choose an album to move {selectedImages.size} selected image{selectedImages.size !== 1 ? 's' : ''} to:
            </p>
            <div className="space-y-2">
              {/* Unassigned option */}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleBulkMoveToAlbum('')}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Unassigned (No Album)
              </Button>

              {/* Available albums */}
              {event.albums
                .filter((album) => {
                  // For owners/members, show all albums including Hidden
                  // For guests, only show visible albums (though guests can't access this modal anyway)
                  if (uiMode === 'OWNER_UI' || uiMode === 'AUTH_UI') {
                    return true
                  }
                  return album.isVisible !== false
                })
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((album) => (
                <Button
                  key={album.id}
                  variant="outline"
                  className={`w-full justify-start ${
                    album.name === 'Hidden Images' ? 'border-orange-300 text-orange-700' : ''
                  }`}
                  onClick={() => handleBulkMoveToAlbum(album.id)}
                >
                  {album.name === 'Hidden Images' ? (
                    <EyeOff className="h-4 w-4 mr-2" />
                  ) : (
                    <FolderPlus className="h-4 w-4 mr-2" />
                  )}
                  {album.name}
                </Button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAlbumModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}