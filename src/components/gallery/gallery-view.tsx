"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CloudflareImage } from "@/components/ui/cloudflare-image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Camera, 
  MessageSquare, 
  Mic, 
  Heart, 
  Download, 
  Share2, 
  Search, 
  Grid3X3, 
  List, 
  User, 
  Calendar,
  Info,
  Play,
  Check,
  X,
  ChevronDown,
  Upload
} from "lucide-react"
import { ImageViewer } from "./image-viewer"
import { MessageDialog } from "./message-dialog"
import Masonry from 'react-masonry-css'
import { GuestbookEntries } from "./guestbook-entries"
import { AudioPlayer } from "./audio-player"
import { toast } from "sonner"
import { approveUpload, rejectUpload } from "@/app/actions/upload"

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
  approveUploads: boolean
  userId: string
  albums: { id: string; name: string; sortOrder: number }[]
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

interface GalleryViewProps {
  event: Event
  uploads: Upload[]
  pendingUploads?: Upload[]
  eventSlug: string
  isOwner?: boolean
  hasEventAccess?: boolean
  continuationCard?: React.ReactNode
}

export function GalleryView({ event, uploads, pendingUploads = [], eventSlug, isOwner = false, hasEventAccess = false, continuationCard }: GalleryViewProps) {
  // Debug privacy logic
  console.log(`🎭 GalleryView privacy debug:`, {
    guestCanViewAlbum: event.guestCanViewAlbum,
    hasEventAccess,
    isOwner,
    shouldShowGallery: event.guestCanViewAlbum || hasEventAccess,
    eventId: event.id
  })
  
  const [selectedTab, setSelectedTab] = useState<'photos' | 'audio' | 'guestbook' | 'pending'>('photos')
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [guestbookCount, setGuestbookCount] = useState(event.guestbookCount)
  const router = useRouter()

  // Check if upload window is open
  const uploadWindowOpen = event.activationDate ? 
    new Date() >= new Date(event.activationDate) && 
    new Date() <= new Date(event.uploadWindowEnd || event.activationDate)
    : true
  
  // Removed dynamic theming for simplicity
  
  // Masonry layout handles responsive columns automatically

  const handleMessageAdded = () => {
    setGuestbookCount(prev => prev + 1)
  }


  // Filter approved uploads for photos tab (exclude audio)
  const filteredUploads = selectedTab === 'photos' ? uploads.filter(upload => {
    const isPhotoOrVideo = upload.fileType === 'image' || upload.fileType === 'video'
    const matchesSearch = searchQuery === '' || 
      upload.uploaderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.caption?.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Album filtering
    const matchesAlbum = selectedAlbum === 'all' || 
      (selectedAlbum === 'unassigned' && !upload.albumId) ||
      upload.albumId === selectedAlbum
    
    return isPhotoOrVideo && matchesSearch && matchesAlbum
  }) : []

  // Filter audio uploads for audio tab
  const filteredAudioUploads = selectedTab === 'audio' ? uploads.filter(upload => {
    const isAudio = upload.fileType === 'audio'
    const matchesSearch = searchQuery === '' || 
      upload.uploaderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.caption?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return isAudio && matchesSearch
  }) : []

  // Filter pending uploads for pending tab (exclude audio)
  const filteredPendingUploads = selectedTab === 'pending' && hasEventAccess ? pendingUploads.filter(upload => {
    const isPhotoOrVideo = upload.fileType === 'image' || upload.fileType === 'video'
    const matchesSearch = searchQuery === '' || 
      upload.uploaderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.caption?.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Album filtering
    const matchesAlbum = selectedAlbum === 'all' || 
      (selectedAlbum === 'unassigned' && !upload.albumId) ||
      upload.albumId === selectedAlbum
    
    return isPhotoOrVideo && matchesSearch && matchesAlbum
  }) : []

  // Filter pending audio uploads for pending tab
  const filteredPendingAudioUploads = selectedTab === 'pending' && hasEventAccess ? pendingUploads.filter(upload => {
    const isAudio = upload.fileType === 'audio'
    const matchesSearch = searchQuery === '' || 
      upload.uploaderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.caption?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return isAudio && matchesSearch
  }) : []

  // Choose which uploads to display
  const displayUploads = selectedTab === 'pending' ? filteredPendingUploads : filteredUploads
  const displayAudioUploads = selectedTab === 'pending' ? filteredPendingAudioUploads : filteredAudioUploads

  // Calculate counts
  const pendingPhotoCount = pendingUploads.filter(u => u.fileType === 'image' || u.fileType === 'video').length
  const pendingAudioCount = pendingUploads.filter(u => u.fileType === 'audio').length
  const approvedPhotoCount = uploads.filter(u => u.fileType === 'image' || u.fileType === 'video').length
  const approvedAudioCount = uploads.filter(u => u.fileType === 'audio').length

  const openImageModal = (upload: Upload) => {
    setSelectedUpload(upload)
  }

  const closeImageModal = () => {
    setSelectedUpload(null)
  }

  const handleApprove = async (uploadId: string) => {
    try {
      const result = await approveUpload(uploadId)
      
      if (result.success) {
        toast.success('Upload approved successfully')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to approve upload')
      }
    } catch (error) {
      toast.error('Failed to approve upload')
    }
  }

  const handleReject = async (uploadId: string) => {
    try {
      const result = await rejectUpload(uploadId)
      
      if (result.success) {
        toast.success('Upload rejected')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to reject upload')
      }
    } catch (error) {
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
                {new Date(event.eventDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button asChild size="lg" className="bg-primary/90 backdrop-blur-sm text-primary-foreground hover:bg-primary transition-all duration-300 h-14 text-base font-medium rounded-lg shadow-xl border border-white/20">
                  <Link href={`/gallery/${eventSlug}/upload`}>
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
                  <Link href={`/gallery/${eventSlug}/voice`}>
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
                {new Date(event.eventDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 h-14 text-base font-medium rounded-lg shadow-lg">
                  <Link href={`/gallery/${eventSlug}/upload`}>
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
                  <Link href={`/gallery/${eventSlug}/voice`}>
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
        {(event.guestCanViewAlbum || hasEventAccess) ? (
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
                <TabsTrigger value="audio" className="data-[state=active]:bg-background flex-shrink-0">
                  Audio Messages ({approvedAudioCount})
                </TabsTrigger>
                {hasEventAccess && event.approveUploads && (
                  <TabsTrigger value="pending" className="data-[state=active]:bg-background flex-shrink-0">
                    Pending ({pendingPhotoCount + pendingAudioCount})
                  </TabsTrigger>
                )}
                <TabsTrigger value="guestbook" className="data-[state=active]:bg-background flex-shrink-0">
                  Messages ({guestbookCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Upload Review Notice */}
            {event.approveUploads && selectedTab === 'photos' && (
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Upload Review:</strong> Photos and videos you upload may take some time to appear in the gallery as the host reviews all uploads before they are published.
                </AlertDescription>
              </Alert>
            )}

            {selectedTab === 'audio' ? (
              <div>
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
                      <Button onClick={() => router.push(`/gallery/${eventSlug}/voice`)}>
                        <Mic className="h-4 w-4 mr-2" />
                        Record Audio Message
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : selectedTab === 'photos' || selectedTab === 'pending' ? (
              <div>
                {/* Album Filter Tabs */}
                {event.albums.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Filter by Album:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedAlbum === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedAlbum('all')}
                      >
                        All Photos ({selectedTab === 'pending' ? pendingUploads.filter(u => u.fileType === 'image' || u.fileType === 'video').length : uploads.filter(u => u.fileType === 'image' || u.fileType === 'video').length})
                      </Button>
                      <Button
                        variant={selectedAlbum === 'unassigned' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedAlbum('unassigned')}
                      >
                        General ({selectedTab === 'pending' ? pendingUploads.filter(u => (u.fileType === 'image' || u.fileType === 'video') && !u.albumId).length : uploads.filter(u => (u.fileType === 'image' || u.fileType === 'video') && !u.albumId).length})
                      </Button>
                      {event.albums.map((album) => {
                        const albumUploads = selectedTab === 'pending' 
                          ? pendingUploads.filter(u => (u.fileType === 'image' || u.fileType === 'video') && u.albumId === album.id)
                          : uploads.filter(u => (u.fileType === 'image' || u.fileType === 'video') && u.albumId === album.id)
                        return (
                          <Button
                            key={album.id}
                            variant={selectedAlbum === album.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedAlbum(album.id)}
                          >
                            {album.name} ({albumUploads.length})
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
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Photo Masonry Grid */}
                {viewMode === 'grid' ? (
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
                    {displayUploads.map((upload) => (
                      <div 
                        key={upload.id} 
                        className="relative cursor-pointer group overflow-hidden rounded-lg mb-3"
                        onClick={() => openImageModal(upload)}
                      >
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
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                        
                        {/* Video badge */}
                        {upload.fileType === 'video' && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-black/60 text-white border-none">
                              <Play className="h-3 w-3" />
                              Video
                            </Badge>
                          </div>
                        )}

                        {/* Approval buttons for pending tab */}
                        {selectedTab === 'pending' && hasEventAccess && (
                          <div className="absolute top-2 left-2 flex gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleApprove(upload.id)
                              }}
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleReject(upload.id)
                              }}
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
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
                    ))}
                  </Masonry>
                ) : (
                  <div className="space-y-2">
                    {displayUploads.map((upload) => (
                      <Card key={upload.id}>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="relative w-12 h-12 flex-shrink-0 cursor-pointer group"
                              onClick={() => openImageModal(upload)}
                            >
                              <CloudflareImage
                                src={upload.fileUrl}
                                alt={upload.fileName}
                                fill
                                className="object-cover rounded transition-transform group-hover:scale-110"
                                sizes="48px"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded" />
                              {upload.fileType === 'video' && (
                                <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs">
                                  <Play className="h-3 w-3" />
                                </Badge>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm font-medium truncate">
                                  {upload.uploaderName || 'Anonymous'}
                                </span>
                              </div>
                              {upload.caption && (
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                  {upload.caption}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(upload.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm">
                                <Heart className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

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
                      {selectedTab === 'pending' ? 'No pending uploads' : 'No photos yet'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {selectedTab === 'pending' 
                        ? 'All uploads have been reviewed.' 
                        : 'Be the first to share a photo from this event!'
                      }
                    </p>
                    {uploadWindowOpen && selectedTab !== 'pending' && (
                      <Button onClick={() => router.push(`/gallery/${eventSlug}/upload`)}>
                        <Camera className="h-4 w-4 mr-2" />
                        Upload Photos
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
                <GuestbookEntries eventId={event.id} onMessageAdded={handleMessageAdded} />
              </div>
            )}
          </>
        ) : (
          /* Private Gallery Message */
          <div className="max-w-2xl mx-auto text-center py-12 px-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Looking for photos?</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  If you are seeing this message it means the album host has decided to keep the photos and videos private at this time.
                </p>
                <p>
                  The host encourages everyone to please continue to upload all the moments they have captured and the host will decide later if and when they are going to share.
                </p>
              </div>
            </div>
            
            {uploadWindowOpen && (
              <Button
                size="lg"
                onClick={() => router.push(`/gallery/${eventSlug}/upload`)}
                className="px-8"
              >
                <Camera className="h-5 w-5 mr-2" />
                Upload Photos
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      <ImageViewer
        upload={selectedUpload}
        isOpen={selectedUpload !== null}
        onClose={closeImageModal}
      />

      {/* Message Dialog */}
      <MessageDialog
        eventId={event.id}
        eventName={event.name}
        isOpen={isMessageDialogOpen}
        onClose={() => setIsMessageDialogOpen(false)}
        onMessageAdded={handleMessageAdded}
      />
    </div>
  )
}