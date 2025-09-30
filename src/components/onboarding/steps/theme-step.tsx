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
      {/* Theme Manager */}
      <div>
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

      {hasSelectedTheme && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-green-800">
            <CheckCircle className="w-4 h-4" />
            Perfect theme choice!
          </div>
        </div>
      )}
    </div>
  )
}