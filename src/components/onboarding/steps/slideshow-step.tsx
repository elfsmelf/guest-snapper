"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Loader2, CheckCircle, Presentation, MonitorPlay, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { type OnboardingState } from "@/types/onboarding"
import { updateOnboardingProgress } from "@/app/actions/onboarding"
import { SlideshowSettings } from "@/components/slideshow-settings"
import { useEventData, useUploadCount } from "@/hooks/use-onboarding"

interface SlideshowStepProps {
  eventId: string
  eventSlug: string
  eventName: string
  state: OnboardingState
  onUpdate: (updates: Partial<OnboardingState>) => void
  onComplete: () => Promise<any>
}

export function SlideshowStep({
  eventId,
  eventSlug,
  eventName,
  state,
  onUpdate,
  onComplete
}: SlideshowStepProps) {
  const [hasTested, setHasTested] = useState(false)

  const slideshowUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/gallery/${eventSlug}/slideshow`

  // Use React Query cached data - should be available from prefetching
  const { data: event } = useEventData(eventId)
  const { data: uploadCountData } = useUploadCount(eventId)
  
  // Use data when available, with sensible defaults
  const uploadCount = uploadCountData?.count || 0
  const eventData = event || { 
    slideDuration: 10 // Default slide duration
  }

  const handleTestSlideshow = async () => {
    setHasTested(true)
    // Update onboarding progress immediately when slideshow is tested
    onUpdate({ slideshowTested: true })
    
    // Also persist to database
    try {
      await updateOnboardingProgress(eventId, { slideshowTested: true })
    } catch (error) {
      console.error('Failed to update slideshow test progress:', error)
    }
    
    window.open(slideshowUrl, '_blank', 'noopener,noreferrer')
    toast.success('Slideshow opened in new tab!')
  }


  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Test Slideshow</h3>
        <p className="text-muted-foreground">
          Configure your slideshow settings and test the display (optional but recommended).
        </p>
      </div>

      {/* Landscape Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Section */}
        <div className="space-y-4">
          <SlideshowSettings
            eventId={eventId}
            eventSlug={eventSlug}
            currentDuration={eventData.slideDuration || 10}
            hasPhotos={uploadCount > 0}
          />
        </div>

        {/* Test & Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitorPlay className="w-5 h-5" />
              Test & Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Status */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Gallery Status</div>
              <div className="p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Photos & Videos</span>
                  <span className="font-semibold">{uploadCount}</span>
                </div>
                {uploadCount === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Upload some photos to test your slideshow
                  </p>
                ) : (
                  <p className="text-xs text-green-600">
                    ✓ Ready for slideshow testing
                  </p>
                )}
              </div>
            </div>

            {/* Test Button */}
            <div className="space-y-3">
              <Button
                onClick={handleTestSlideshow}
                disabled={uploadCount === 0}
                className="w-full"
                size="lg"
              >
                <Play className="mr-2 h-4 w-4" />
                {uploadCount === 0 ? 'Upload Photos First' : 'Test Slideshow'}
              </Button>
              {hasTested && (
                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Slideshow tested!
                </div>
              )}
            </div>

            {/* Usage Instructions */}
            <div className="space-y-4">
              <div className="text-sm font-medium">How to use slideshow:</div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Presentation className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Display at Event</div>
                    <div className="text-xs text-muted-foreground">Perfect for reception screens or photo displays</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MonitorPlay className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Full Screen Mode</div>
                    <div className="text-xs text-muted-foreground">Press F11 or fullscreen button for best experience</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Remote Control</div>
                    <div className="text-xs text-muted-foreground">Use spacebar to pause/play, arrow keys to navigate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pro Tip */}
            {uploadCount > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-2">💡 Pro Tip</div>
                <div className="text-xs text-blue-700">
                  Test your slideshow before the event to ensure the timing works well with your photos. 
                  You can adjust the speed anytime from your gallery settings.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {!hasTested && uploadCount > 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Testing your slideshow helps ensure it works perfectly at your event
          </p>
        </div>
      )}
    </div>
  )
}