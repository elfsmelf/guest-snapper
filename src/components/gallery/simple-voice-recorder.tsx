"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  X
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
  duration: number
}

export function SimpleVoiceRecorder({ event, uploadWindowOpen, isOwner, guestCanUpload = false }: VoiceRecorderProps) {
  const [uploaderName, setUploaderName] = useState("")
  const [message, setMessage] = useState("")
  const [audioMessages, setAudioMessages] = useState<AudioMessage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const router = useRouter()
  
  const audioChunks = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Check session for authenticated users
  const { data: session } = authClient.useSession()

  useEffect(() => {
    return () => {
      // Cleanup
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop())
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [audioStream])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      setAudioStream(stream)
      audioChunks.current = []
      
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data)
        }
      }
      
      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { 
          type: recorder.mimeType || 'audio/webm' 
        })
        
        const newAudioMessage: AudioMessage = {
          id: Math.random().toString(36).substr(2, 9),
          blob: blob,
          url: URL.createObjectURL(blob),
          uploaderName: uploaderName,
          message: message,
          status: 'pending',
          progress: 0,
          duration: recordingTime
        }
        
        setAudioMessages(prev => [...prev, newAudioMessage])
        setMessage("") // Clear message after adding recording
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        setAudioStream(null)
      }
      
      setMediaRecorder(recorder)
      recorder.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsRecording(false)
    setMediaRecorder(null)
  }

  const removeAudioMessage = (id: string) => {
    setAudioMessages(prev => {
      const audioMessage = prev.find(a => a.id === id)
      if (audioMessage) {
        URL.revokeObjectURL(audioMessage.url)
      }
      return prev.filter(a => a.id !== id)
    })
  }

  const updateAudioMessage = (id: string, updates: Partial<AudioMessage>) => {
    setAudioMessages(prev => prev.map(audio => 
      audio.id === id ? { ...audio, ...updates } : audio
    ))
  }

  const uploadAudioMessage = async (audioMessage: AudioMessage) => {
    updateAudioMessage(audioMessage.id, { status: 'uploading', progress: 0 })

    try {
      // Generate a unique filename
      const timestamp = Date.now()
      const fileName = `voice_message_${timestamp}.webm`
      
      // Step 1: Get presigned URL
      updateAudioMessage(audioMessage.id, { progress: 10 })
      
      const urlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          fileName: fileName,
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
          fileName: fileName,
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
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{event.coupleNames}</h1>
          <p className="text-muted-foreground">
            Share your audio messages from {event.name}
          </p>
        </div>

        {/* Uploader Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="uploader-name">Your Name (Optional)</Label>
              <Input
                id="uploader-name"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                placeholder="Enter your name to be credited with messages"
                disabled={isUploading || isRecording}
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
            <div>
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a text message to go with your voice recording..."
                disabled={isUploading || isRecording}
                rows={3}
              />
            </div>

            {/* Recording Controls */}
            <div className="flex items-center justify-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <div className="text-center space-y-4">
                {isRecording && (
                  <div className="text-center">
                    <div className="text-2xl font-mono font-bold text-red-500">
                      {formatDuration(recordingTime)}
                    </div>
                    <p className="text-sm text-muted-foreground">Recording...</p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-4">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      disabled={!uploadWindowOpen || isUploading}
                      size="lg"
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Mic className="h-5 w-5 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      variant="destructive"
                    >
                      <Square className="h-5 w-5 mr-2" />
                      Stop Recording
                    </Button>
                  )}
                </div>

                {!isRecording && (
                  <p className="text-sm text-muted-foreground">
                    Click to start recording your voice message
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audio Messages List */}
        {audioMessages.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Audio Messages ({audioMessages.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {audioMessages.map((audioMessage) => (
                <div key={audioMessage.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {/* Audio Player */}
                    <div className="flex-shrink-0">
                      <audio
                        src={audioMessage.url}
                        controls
                        className="w-64"
                      />
                    </div>

                    {/* Message Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">
                          Duration: {formatDuration(audioMessage.duration)}
                        </span>
                        {audioMessage.status === 'success' && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Uploaded
                          </span>
                        )}
                        {audioMessage.status === 'error' && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Failed
                          </span>
                        )}
                        {audioMessage.status === 'uploading' && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Uploading
                          </span>
                        )}
                      </div>

                      {/* Progress */}
                      {audioMessage.status === 'uploading' && (
                        <Progress value={audioMessage.progress} className="mb-2" />
                      )}

                      {/* Error message */}
                      {audioMessage.status === 'error' && audioMessage.error && (
                        <p className="text-sm text-destructive mb-2">{audioMessage.error}</p>
                      )}

                      {/* Name and Message */}
                      {audioMessage.uploaderName && (
                        <p className="text-sm text-muted-foreground">
                          From: {audioMessage.uploaderName}
                        </p>
                      )}
                      {audioMessage.message && (
                        <p className="text-sm mt-1">{audioMessage.message}</p>
                      )}
                    </div>

                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAudioMessage(audioMessage.id)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Upload Actions */}
        {audioMessages.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {successCount > 0 && (
                <span className="text-green-600">
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