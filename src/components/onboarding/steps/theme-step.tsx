"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Sparkles, Eye, Paintbrush } from "lucide-react"
import { toast } from "sonner"
import { type OnboardingState } from "@/types/onboarding"
import { GalleryThemeManager } from "@/components/gallery-theme-manager"
import { useEventData } from "@/hooks/use-onboarding"

interface ThemeStepProps {
  eventId: string
  eventSlug: string
  eventName: string
  state: OnboardingState
  onUpdate: (updates: Partial<OnboardingState>) => void
  onComplete: () => Promise<any>
}

export function ThemeStep({
  eventId,
  eventSlug,
  eventName,
  state,
  onUpdate,
  onComplete
}: ThemeStepProps) {
  const [hasSelectedTheme, setHasSelectedTheme] = useState(false)

  // Use prefetched event data
  const { data: event, isLoading } = useEventData(eventId)

  // Update theme selection state when event data loads
  useEffect(() => {
    if (event) {
      setHasSelectedTheme(event.themeId && event.themeId !== 'default')
    }
  }, [event])

  const handleThemeChange = async (themeId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId }),
      })

      if (!response.ok) {
        throw new Error('Failed to update theme')
      }

      // Update local state
      setHasSelectedTheme(themeId !== 'default')
      
      // Update onboarding progress when theme is selected
      if (themeId !== 'default') {
        onUpdate({ themeSelected: true })
      }
      
      toast.success('Theme updated successfully!')
    } catch (error) {
      console.error('Error updating theme:', error)
      throw error // Re-throw to let GalleryThemeManager handle the error
    }
  }


  if (!event) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load event data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Choose Your Gallery Theme
        </h3>
        <p className="text-muted-foreground">
          The final touch! Select a beautiful theme that matches your event style and personality.
        </p>
      </div>

      {/* Theme Selection Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Theme Manager - Takes 3 columns */}
        <div className="lg:col-span-3">
          <GalleryThemeManager
            eventId={eventId}
            currentThemeId={event.themeId || 'default'}
            onThemeChange={handleThemeChange}
            eventData={{
              coupleNames: event.coupleNames || eventName,
              eventDate: event.eventDate,
              coverImageUrl: event.coverImageUrl
            }}
          />
        </div>

        {/* Information & Final Steps Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paintbrush className="w-5 h-5" />
              Final Step!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Completion Status */}
            <div className="space-y-4">
              <div className="text-sm font-medium">Gallery Setup Progress:</div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Photos uploaded</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Settings configured</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Gallery published</span>
                </div>
                
                <div className="flex items-center gap-3">
                  {hasSelectedTheme ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className="text-sm">Theme selected</span>
                </div>
              </div>
            </div>

            {/* Theme Benefits */}
            <div className="space-y-4">
              <div className="text-sm font-medium">Why choose a theme?</div>
              
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  • Match your event's style and colors
                </div>
                <div className="text-xs text-muted-foreground">
                  • Create a cohesive visual experience
                </div>
                <div className="text-xs text-muted-foreground">
                  • Make your gallery unique and memorable
                </div>
                <div className="text-xs text-muted-foreground">
                  • Professional, polished appearance
                </div>
              </div>
            </div>

            {/* Preview Reminder */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-2">💡 Preview Tip</div>
              <div className="text-xs text-blue-700">
                The theme preview shows how your gallery will look to guests. 
                You can always change it later from your gallery settings.
              </div>
            </div>

            {/* Gallery URL */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Your Gallery:</div>
              <div className="p-2 bg-muted/30 rounded border">
                <code className="text-xs break-all">
                  /gallery/{eventSlug}
                </code>
              </div>
            </div>

            {hasSelectedTheme && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  Perfect theme choice!
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Gallery Preview Link */}
      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="flex items-center gap-2"
        >
          <a 
            href={`/gallery/${eventSlug}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Eye className="w-4 h-4" />
            Preview Your Gallery
          </a>
        </Button>
      </div>
    </div>
  )
}