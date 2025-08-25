"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { getGalleryTheme, PRECOMPILED_THEMES } from "@/lib/gallery-themes"
// Load gallery theme fonts directly from Google Fonts (only when gallery components are used)
import "@/styles/gallery-fonts.css"

interface GalleryThemeProviderProps {
  children: React.ReactNode
  themeId: string
}

export function GalleryThemeProvider({ children, themeId }: GalleryThemeProviderProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [galleryMode, setGalleryMode] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update gallery mode based on next-themes
  useEffect(() => {
    if (!mounted) return
    setGalleryMode(resolvedTheme === 'dark' ? 'dark' : 'light')
  }, [resolvedTheme, mounted])

  useEffect(() => {
    if (!mounted) return

    const galleryTheme = getGalleryTheme(themeId)
    
    if (PRECOMPILED_THEMES.has(themeId)) {
      // For precompiled themes, fonts are loaded via CSS @import
      // No need for dynamic font loading
      
      // Clean up any runtime styles for this theme
      const runtimeStyle = document.getElementById(`gallery-theme-styles-${themeId}`)
      if (runtimeStyle) {
        runtimeStyle.remove()
      }
    } else {
      // Runtime theme injection
      const themeVars = galleryMode === 'dark' ? galleryTheme.darkMode : galleryTheme.lightMode
      
      let styleElement = document.getElementById(`gallery-theme-styles-${themeId}`) as HTMLStyleElement
      if (!styleElement) {
        styleElement = document.createElement('style')
        styleElement.id = `gallery-theme-styles-${themeId}`
        document.head.appendChild(styleElement)
      }

      // Generate CSS for runtime themes
      const lightVars = Object.entries(galleryTheme.lightMode)
        .map(([property, value]) => `  ${property}: ${value};`)
        .join('\n')

      const darkVars = Object.entries(galleryTheme.darkMode)
        .map(([property, value]) => `  ${property}: ${value};`)
        .join('\n')

      styleElement.textContent = `
        .gallery-app[data-gallery-theme="${themeId}"][data-gallery-mode="light"] {
${lightVars}
        }
        
        .gallery-app[data-gallery-theme="${themeId}"][data-gallery-mode="dark"] {
${darkVars}
        }
      `
    }

    // Set data attributes for CSS targeting
    document.documentElement.setAttribute('data-gallery-theme', themeId)
    document.documentElement.setAttribute('data-gallery-mode', galleryMode)

    // Cleanup function
    return () => {
      document.documentElement.removeAttribute('data-gallery-theme')
      document.documentElement.removeAttribute('data-gallery-mode')
      
      // Only clean up runtime styles
      if (!PRECOMPILED_THEMES.has(themeId)) {
        const runtimeStyle = document.getElementById(`gallery-theme-styles-${themeId}`)
        if (runtimeStyle) {
          runtimeStyle.remove()
        }
      }
    }
  }, [themeId, galleryMode, mounted])

  // Determine CSS classes for the container - apply theme immediately
  const containerClasses = PRECOMPILED_THEMES.has(themeId) 
    ? `gallery-app gallery-theme-${themeId}`
    : 'gallery-app'

  return (
    <div 
      className={containerClasses}
      data-gallery-theme={themeId}
      data-gallery-mode={galleryMode}
    >
      {children}
    </div>
  )
}