"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { updateEventTheme } from "@/app/actions/update-theme"
import { GALLERY_THEMES } from "@/lib/gallery-themes"
import { Palette } from "lucide-react"

interface GalleryThemeSwitcherProps {
  eventId: string
  currentThemeId: string
  isOwner: boolean
}

export function GalleryThemeSwitcher({ eventId, currentThemeId, isOwner }: GalleryThemeSwitcherProps) {
  const [isChanging, setIsChanging] = useState(false)

  if (!isOwner) return null

  const handleThemeChange = async (themeId: string) => {
    if (themeId === currentThemeId) return
    
    setIsChanging(true)
    try {
      await updateEventTheme(eventId, themeId)
      window.location.reload() // Refresh to apply new theme
    } catch (error) {
      console.error('Failed to change theme:', error)
    } finally {
      setIsChanging(false)
    }
  }

  const themes = Object.values(GALLERY_THEMES)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="h-4 w-4" />
          <span className="text-sm font-medium">Theme</span>
        </div>
        <div className="flex gap-2">
          {themes.map((theme) => (
            <Button
              key={theme.id}
              size="sm"
              variant={currentThemeId === theme.id ? "default" : "outline"}
              onClick={() => handleThemeChange(theme.id)}
              disabled={isChanging}
              className="text-xs"
            >
              {theme.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}