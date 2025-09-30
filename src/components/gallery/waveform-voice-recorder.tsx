"use client"

import { useState, useRef, useCallback, memo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { useReactMediaRecorder } from 'react-media-recorder'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  X,
  Mic,
  ArrowLeft,
  Square,
  Play,
  Pause
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Event {
  id: string
  name: string
  coupleNames: string
  slug: string
  uploadWindowEnd: string
}

interface VoiceRecorderProps {
  event: Event
  uploadWindowOpen: boolean
  isOwner: boolean
  guestCanUpload?: boolean
}

interface AudioMessage {
  id: string
  blob: Blob
  url: string
  uploaderName: string
  message: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  fileName: string
  duration: number
}

// Simple audio player component
const AudioPlayer = memo(({ audioMessage, onRemove, isUploading }: {
  audioMessage: AudioMessage,
  onRemove: (id: string) => void,
  isUploading: boolean
}) => {
  const handleRemove = useCallback(() => {
    onRemove(audioMessage.id)
  }, [onRemove, audioMessage.id])

  const formatDuration = useCallback((seconds: number): string => {
    // Handle invalid or very large numbers
    if (!seconds || seconds <= 0 || seconds > 3600) {
      return '0:00'
    }
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])

  return (
    <div className="border rounded-lg p-4">
      <div className="space-y-4">
        {/* Audio Player - Full Width */}
        <div className="bg-muted rounded-lg p-3">
          <audio
            src={audioMessage.url}
            controls
            className="w-full"
            style={{ height: '50px' }}
          />
        </div>

        {/* Message Info and Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-medium text-sm">
              {formatDuration(audioMessage.duration)}
            </span>
            
            {audioMessage.status === 'success' && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Uploaded
              </span>
            )}
            {audioMessage.status === 'error' && (
              <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Failed
              </span>
            )}
            {audioMessage.status === 'uploading' && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Uploading
              </span>
            )}
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        {audioMessage.status === 'uploading' && (
          <Progress value={audioMessage.progress} className="h-2" />
        )}

        {/* Error message */}
        {audioMessage.status === 'error' && audioMessage.error && (
          <p className="text-sm text-destructive">{audioMessage.error}</p>
        )}
        
        {/* Name and Message */}
        {(audioMessage.uploaderName || audioMessage.message) && (
          <div className="text-sm space-y-1">
            {audioMessage.uploaderName && (
              <p className="text-muted-foreground">
                From: <span className="font-medium">{audioMessage.uploaderName}</span>
              </p>
            )}
            {audioMessage.message && (
              <p className="text-foreground">{audioMessage.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

const MemoizedAudioPlayer = memo(AudioPlayer)

export function WaveformVoiceRecorder({ event, uploadWindowOpen, isOwner, guestCanUpload = false }: VoiceRecorderProps) {
  const [uploaderName, setUploaderName] = useState("")
  const [message, setMessage] = useState("")
  const [audioMessages, setAudioMessages] = useState<AudioMessage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0)
  const [recordingDuration, setRecordingDuration] = useState<number>(0)
  const router = useRouter()

  // Check session for authenticated users
  const { data: session } = authClient.useSession()

  // Use react-media-recorder hook for audio recording
  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    video: false,
    onStart: () => {
      setRecordingStartTime(Date.now())
      setRecordingDuration(0)
    },
    onStop: (blobUrl: string, blob: Blob) => {
      if (blob && blobUrl) {
        const duration = Math.floor((Date.now() - recordingStartTime) / 1000)
        addRecordingToQueue(blob, blobUrl, duration)
        clearBlobUrl() // Clear the media recorder's blob URL since we're managing our own
      }
      setRecordingDuration(0)
    },
  })

  // Timer effect - updates every second while recording
  useEffect(() => {
    if (status !== 'recording') return

    const intervalId = setInterval(() => {
      // Functional update to avoid stale closure
      setRecordingDuration(prev => prev + 1)
    }, 1000)

    // Cleanup on unmount or when recording stops
    return () => clearInterval(intervalId)
  }, [status])

  // Add recording to queue when recording stops
  const addRecordingToQueue = useCallback((blob: Blob, url: string, duration: number) => {
    const timestamp = Date.now()
    const fileName = `voice_message_${timestamp}.webm`
    
    const newAudioMessage: AudioMessage = {
      id: Math.random().toString(36).substr(2, 9),
      blob: blob,
      url: url,
      uploaderName: uploaderName,
      message: message,
      status: 'pending',
      progress: 0,
      fileName: fileName,
      duration: duration
    }
    
    setAudioMessages(prev => [...prev, newAudioMessage])
    setMessage("") // Clear message after adding recording
  }, [uploaderName, message])


  const removeAudioMessage = useCallback((id: string) => {
    setAudioMessages(prev => {
      const audioMessage = prev.find(a => a.id === id)
      if (audioMessage) {
        URL.revokeObjectURL(audioMessage.url)
      }
      return prev.filter(a => a.id !== id)
    })
  }, [])

  const updateAudioMessage = (id: string, updates: Partial<AudioMessage>) => {
    setAudioMessages(prev => prev.map(audio => 
      audio.id === id ? { ...audio, ...updates } : audio
    ))
  }

  const uploadAudioMessage = async (audioMessage: AudioMessage) => {
    updateAudioMessage(audioMessage.id, { status: 'uploading', progress: 0 })

    try {
      // Step 1: Get presigned URL
      updateAudioMessage(audioMessage.id, { progress: 10 })
      
      const urlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          fileName: audioMessage.fileName,
          fileType: 'audio/webm',
          fileSize: audioMessage.blob.size
        })
      })

      const urlResult = await urlResponse.json()
      
      if (!urlResult.success) {
        throw new Error(urlResult.error)
      }

      // Step 2: Upload directly to R2
      updateAudioMessage(audioMessage.id, { progress: 50 })
      
      const uploadResponse = await fetch(urlResult.uploadUrl, {
        method: 'PUT',
        body: audioMessage.blob,
        headers: {
          'Content-Type': 'audio/webm',
        },
      })

      if (!uploadResponse.ok) {
        throw new Error(`R2 upload failed: ${uploadResponse.status}`)
      }

      // Step 3: Save metadata to database
      updateAudioMessage(audioMessage.id, { progress: 80 })
      
      const dbResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          albumId: null,
          uploaderName: audioMessage.uploaderName || null,
          caption: audioMessage.message || null,
          fileName: audioMessage.fileName,
          fileSize: audioMessage.blob.size,
          fileType: 'audio',
          fileKey: urlResult.fileKey,
          fileUrl: urlResult.fileUrl,
          mimeType: 'audio/webm'
        })
      })

      const dbResult = await dbResponse.json()

      if (dbResult.success) {
        updateAudioMessage(audioMessage.id, { status: 'success', progress: 100 })
      } else {
        throw new Error(dbResult.error)
      }
      
    } catch (error) {
      updateAudioMessage(audioMessage.id, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Upload failed',
        progress: 0 
      })
      console.error(`Upload failed for audio message:`, error)
    }
  }

  const uploadAllAudioMessages = async () => {
    if (audioMessages.length === 0) return

    setIsUploading(true)

    for (const audioMessage of audioMessages) {
      if (audioMessage.status !== 'pending') continue
      await uploadAudioMessage(audioMessage)
    }

    setIsUploading(false)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const successCount = audioMessages.filter(a => a.status === 'success').length
  const errorCount = audioMessages.filter(a => a.status === 'error').length

  if (!uploadWindowOpen && !isOwner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Upload Window Closed</h1>
          <p className="text-muted-foreground mb-6">
            The upload window for this event has ended. Thank you for your interest in sharing memories!
          </p>
          <Button onClick={() => router.push(`/gallery/${event.slug}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gallery
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        

        {/* Uploader Information */}
        <Card className="mb-6">

          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="uploader-name">Your Name (Optional)</Label>
              <Input
                id="uploader-name"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                placeholder="John Smith"
                disabled={isUploading || status === 'recording'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Voice Recorder */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Message Recorder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Simple Recording Interface */}
            <div className="border rounded-lg p-4 bg-card">
              {status === 'recording' ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-mono font-bold text-destructive animate-pulse">
                      ● REC
                    </div>
                    <div className="text-3xl font-mono font-bold text-foreground my-2">
                      {formatDuration(recordingDuration)}
                    </div>
                    <p className="text-sm text-muted-foreground">Recording in progress...</p>
                  </div>

                  {/* Simple Recording Animation */}
                  <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-3 h-8 bg-primary rounded-full animate-pulse"
                          style={{
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: '1s',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      variant="destructive"
                    >
                      <Square className="h-5 w-5 mr-2" />
                      Stop Recording
                    </Button>
                  </div>
                </div>
              ) : status === 'stopped' && mediaBlobUrl ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-primary">Recording Complete</p>
                    <p className="text-xs text-muted-foreground">Recording automatically added to queue!</p>
                  </div>
                  
                  {/* Preview Player */}
                  <div className="bg-muted rounded-lg p-3">
                    <audio
                      src={mediaBlobUrl}
                      controls
                      className="w-full"
                      style={{ height: '40px' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      onClick={startRecording}
                      disabled={!uploadWindowOpen || isUploading || status === 'acquiring_media'}
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Mic className="h-5 w-5 mr-2" />
                      {status === 'acquiring_media' ? 'Getting Permission...' : 'Start Recording'}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Click to start recording your voice message
                  </p>
                  {status === 'permission_denied' && (
                    <p className="text-sm text-destructive mt-2">
                      Microphone permission denied. Please allow access and try again.
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Audio Messages Queue */}
        {audioMessages.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Audio Messages Queue ({audioMessages.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {audioMessages.map((audioMessage) => (
                <MemoizedAudioPlayer
                  key={audioMessage.id}
                  audioMessage={audioMessage}
                  onRemove={removeAudioMessage}
                  isUploading={isUploading}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Upload Actions */}
        {audioMessages.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {successCount > 0 && (
                <span className="text-primary">
                  {successCount} uploaded successfully
                </span>
              )}
              {errorCount > 0 && (
                <span className="text-destructive ml-4">
                  {errorCount} failed
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  audioMessages.forEach(audio => URL.revokeObjectURL(audio.url))
                  setAudioMessages([])
                }}
                disabled={isUploading}
              >
                Clear All
              </Button>
              
              <Button
                onClick={uploadAllAudioMessages}
                disabled={isUploading || audioMessages.every(a => a.status !== 'pending')}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload All ({audioMessages.filter(a => a.status === 'pending').length})
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successCount > 0 && successCount === audioMessages.length && (
          <Alert className="mt-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>All audio messages uploaded successfully! They will appear in the gallery once approved.</span>
                <Button 
                  size="sm" 
                  onClick={() => router.push(`/gallery/${event.slug}`)}
                  className="ml-4"
                >
                  View Gallery
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}