"use client"

import { useState, useTransition, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Palette, Check, Loader2 } from "lucide-react"
import { GALLERY_THEMES, type GalleryTheme } from "@/lib/gallery-themes"
import { toast } from "sonner"

interface GalleryThemeManagerProps {
  eventId: string
  currentThemeId: string
  onThemeChange: (themeId: string) => Promise<void>
  eventData?: {
    coupleNames?: string
    eventDate?: string
    coverImageUrl?: string
  }
}

export function GalleryThemeManager({ eventId, currentThemeId, onThemeChange, eventData }: GalleryThemeManagerProps) {
  const [selectedTheme, setSelectedTheme] = useState(currentThemeId)
  const [isPending, startTransition] = useTransition()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId)
  }

  const handleSave = () => {
    startTransition(async () => {
      try {
        await onThemeChange(selectedTheme)
        toast.success("Theme updated successfully!")
      } catch (error) {
        toast.error("Failed to update theme. Please try again.")
      }
    })
  }


  const ThemePreview = ({ theme: galleryTheme }: { theme: GalleryTheme }) => {
    // Use dark preview colors if the current theme is dark, otherwise use light colors
    const isDark = mounted && resolvedTheme === 'dark'
    const previewColors = isDark ? galleryTheme.darkPreview : galleryTheme.preview
    // Get font family based on theme
    const getFontFamily = (theme: GalleryTheme) => {
      if (!theme.fontKey || theme.fontKey === 'system') {
        return 'ui-sans-serif, system-ui, sans-serif'
      }
      
      switch (theme.fontKey) {
        case 'lora':
          return '"Lora", Georgia, serif'
        case 'playfair-display':
          return '"Playfair Display", Georgia, serif'
        case 'libre-baskerville':
          return '"Libre Baskerville", Georgia, serif'
        case 'architects-daughter':
          return '"Architects Daughter", ui-sans-serif, system-ui, sans-serif'
        case 'inter':
          return '"Inter", ui-sans-serif, system-ui, sans-serif'
        case 'source-serif-4':
          return '"Source Serif 4", Georgia, serif'
        default:
          return 'ui-serif, Georgia, serif'
      }
    }
    
    const fontFamily = getFontFamily(galleryTheme)
    
    // Extract couple names for display
    const coupleNames = eventData?.coupleNames || 'John & Jane'
    const names = coupleNames.split(' & ').length > 1
      ? coupleNames.split(' & ')
      : coupleNames.split(' and ').length > 1
        ? coupleNames.split(' and ')
        : [coupleNames]
    
    const displayNames = names.length > 1 
      ? `${names[0].trim()} & ${names[1].trim()}`
      : names[0]
    
    // Format date
    const displayDate = eventData?.eventDate 
      ? new Date(eventData.eventDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        })
      : "December 2024"
    
    return (
      <div 
        className="relative rounded-lg cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg overflow-hidden"
        style={{
          border: selectedTheme === galleryTheme.id 
            ? `2px solid ${previewColors.primary}` 
            : `1px solid ${previewColors.primary.includes('hsl') 
                ? previewColors.primary.replace(')', ', 0.2)')
                : previewColors.primary.includes('oklch')
                  ? previewColors.primary.replace(')', ' / 0.2)')
                  : previewColors.primary + '33'}`,
          backgroundColor: previewColors.background
        }}
        onClick={() => handleThemeSelect(galleryTheme.id)}
      >
        <div className="p-4 space-y-4">
          {/* Couple Names and Date */}
          <div className="text-center space-y-2">
            <h3 
              className="text-lg font-bold"
              style={{ 
                color: previewColors.primary,
                fontFamily: fontFamily
              }}
            >
              {displayNames}
            </h3>
            <p 
              className="text-sm"
              style={{ 
                color: previewColors.primary,
                fontFamily: fontFamily,
                opacity: 0.8
              }}
            >
              {displayDate}
            </p>
          </div>
          
          {/* Upload Button - Match real gallery styling */}
          <div className="flex justify-center mb-3">
            <div 
              className="px-4 py-3 rounded-lg text-sm font-medium shadow-xl border backdrop-blur-sm flex items-center gap-2"
              style={{ 
                backgroundColor: previewColors.primary.includes('oklch') 
                  ? previewColors.primary.replace(')', ' / 0.9)')
                  : previewColors.primary,
                color: previewColors.background,
                borderColor: 'rgba(255, 255, 255, 0.2)'
              }}
            >
              Upload Media
            </div>
          </div>
          
          {/* Navigation Tabs - Match real gallery TabsList styling */}
          <div className="space-y-1">
            {/* Tabs Container - bg-muted equivalent */}
            <div 
              className="rounded-lg p-1 overflow-x-auto"
              style={{
                backgroundColor: previewColors.muted
              }}
            >
              <div className="flex gap-1">
                {/* Active Tab - data-[state=active]:bg-background */}
                <div 
                  className="px-2 py-1 rounded text-xs font-medium flex-1 text-center"
                  style={{
                    backgroundColor: previewColors.background,
                    color: previewColors.primary
                  }}
                >
                  Photos
                </div>
                {/* Inactive Tabs */}
                <div 
                  className="px-2 py-1 rounded text-xs flex-1 text-center"
                  style={{
                    backgroundColor: 'transparent',
                    color: previewColors.primary,
                    opacity: 0.7
                  }}
                >
                  Audio
                </div>
                <div 
                  className="px-2 py-1 rounded text-xs flex-1 text-center"
                  style={{
                    backgroundColor: 'transparent',
                    color: previewColors.primary,
                    opacity: 0.7
                  }}
                >
                  Messages
                </div>
              </div>
            </div>
          </div>
          
          {/* Selection Indicator */}
          {selectedTheme === galleryTheme.id && (
            <div className="absolute top-2 right-2">
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-white" 
                style={{ backgroundColor: previewColors.primary }}
              >
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
          )}
          
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Gallery Theme
        </CardTitle>
        <CardDescription>
          Choose a theme for your wedding gallery. This will only affect the gallery pages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(GALLERY_THEMES).map((theme) => (
            <div key={theme.id} className="space-y-2">
              <ThemePreview theme={theme} />
              <div className="px-1">
                <h4 className="font-medium text-sm">{theme.name}</h4>
                <p className="text-xs text-muted-foreground">{theme.description}</p>
              </div>
            </div>
          ))}
        </div>

        {selectedTheme !== currentThemeId && (
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button 
              onClick={handleSave} 
              disabled={isPending}
              className="flex items-center gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Theme
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSelectedTheme(currentThemeId)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}