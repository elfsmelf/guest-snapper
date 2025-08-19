"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExternalLink, Copy, Check, Presentation } from "lucide-react"
import { toast } from "sonner"
import { updateSlideDuration } from "@/app/actions/event-settings"

interface SlideshowSettingsProps {
  eventId: string
  eventSlug: string
  currentDuration: number
  hasPhotos: boolean
}

export function SlideshowSettings({ eventId, eventSlug, currentDuration, hasPhotos }: SlideshowSettingsProps) {
  const [duration, setDuration] = useState(currentDuration.toString())
  const [isUpdating, setIsUpdating] = useState(false)
  const [copied, setCopied] = useState(false)

  const slideshowUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/gallery/${eventSlug}/slideshow`

  const handleDurationChange = async (newDuration: string) => {
    setDuration(newDuration)
    setIsUpdating(true)
    
    try {
      const result = await updateSlideDuration(eventId, parseInt(newDuration))
      
      if (result.success) {
        toast.success('Slideshow speed updated')
      } else {
        toast.error(result.error || 'Failed to update slideshow speed')
        setDuration(currentDuration.toString()) // Reset on error
      }
    } catch (error) {
      toast.error('Failed to update slideshow speed')
      setDuration(currentDuration.toString()) // Reset on error
    } finally {
      setIsUpdating(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(slideshowUrl)
      setCopied(true)
      toast.success('Slideshow link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Presentation className="mr-2 h-5 w-5" />
          Slideshow Settings
        </CardTitle>
        <CardDescription>
          Configure slideshow autoplay speed and share the slideshow link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Autoplay Speed:</label>
          <Select 
            value={duration} 
            onValueChange={handleDurationChange}
            disabled={isUpdating}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 seconds</SelectItem>
              <SelectItem value="10">10 seconds</SelectItem>
              <SelectItem value="15">15 seconds</SelectItem>
              <SelectItem value="20">20 seconds</SelectItem>
              <SelectItem value="30">30 seconds</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Slideshow URL:</label>
          <div className="flex items-center space-x-2">
            <code className="text-xs bg-muted px-1.5 py-1 rounded flex-1 truncate block overflow-hidden">
              {slideshowUrl}
            </code>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-7 w-7"
              onClick={copyToClipboard}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" asChild>
              <a href={slideshowUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>

        {!hasPhotos && (
          <p className="text-sm text-muted-foreground">
            Upload some photos to enable the slideshow feature.
          </p>
        )}
      </CardContent>
    </Card>
  )
}