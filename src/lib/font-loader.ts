/**
 * Font loading utilities for gallery themes
 */

interface FontConfig {
  family: string
  weights: number[]
  styles: string[]
  display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
}

const GALLERY_FONTS: Record<string, FontConfig> = {
  lora: {
    family: 'Lora',
    weights: [400, 500, 600, 700],
    styles: ['normal', 'italic'],
    display: 'swap'
  },
  playfair: {
    family: 'Playfair Display',
    weights: [400, 500, 600, 700, 800, 900],
    styles: ['normal', 'italic'],
    display: 'swap'
  },
  'architects-daughter': {
    family: 'Architects Daughter',
    weights: [400],
    styles: ['normal'],
    display: 'swap'
  },
  'libre-baskerville': {
    family: 'Libre Baskerville',
    weights: [400, 700],
    styles: ['normal', 'italic'],
    display: 'swap'
  }
}

class FontLoader {
  private loadedFonts = new Set<string>()
  private loadingPromises = new Map<string, Promise<void>>()

  /**
   * Load a font family from Google Fonts
   */
  async loadFont(fontKey: string): Promise<void> {
    if (this.loadedFonts.has(fontKey)) {
      return Promise.resolve()
    }

    if (this.loadingPromises.has(fontKey)) {
      return this.loadingPromises.get(fontKey)!
    }

    const config = GALLERY_FONTS[fontKey]
    if (!config) {
      console.warn(`Font configuration not found for: ${fontKey}`)
      return Promise.resolve()
    }

    const promise = this.loadGoogleFont(config)
    this.loadingPromises.set(fontKey, promise)

    try {
      await promise
      this.loadedFonts.add(fontKey)
    } catch (error) {
      console.error(`Failed to load font ${fontKey}:`, error)
    } finally {
      this.loadingPromises.delete(fontKey)
    }
  }

  /**
   * Load font using Google Fonts API
   */
  private async loadGoogleFont(config: FontConfig): Promise<void> {
    // Build Google Fonts URL
    const weightsParam = config.weights.join(',')
    const stylesParam = config.styles.includes('italic') ? 
      `ital,wght@0,${weightsParam};1,${weightsParam}` : 
      `wght@${weightsParam}`
    
    const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(config.family)}:${stylesParam}&display=${config.display}`

    // Create and inject link element
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = fontUrl
    link.crossOrigin = 'anonymous'

    // Wait for font to load
    return new Promise((resolve, reject) => {
      link.onload = () => {
        // Additional check using Font Loading API if available
        if ('fonts' in document) {
          const fontFace = new FontFace(
            config.family,
            `url(${fontUrl})`,
            { display: config.display }
          )
          
          document.fonts.add(fontFace)
          fontFace.load().then(() => resolve()).catch(reject)
        } else {
          resolve()
        }
      }
      link.onerror = reject
      
      // Inject into head
      document.head.appendChild(link)
    })
  }

  /**
   * Preload fonts for better performance
   */
  preloadFont(fontKey: string): void {
    if (typeof window !== 'undefined') {
      // Use requestIdleCallback if available for better performance
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => this.loadFont(fontKey))
      } else {
        setTimeout(() => this.loadFont(fontKey), 100)
      }
    }
  }

  /**
   * Check if font is loaded
   */
  isFontLoaded(fontKey: string): boolean {
    return this.loadedFonts.has(fontKey)
  }

  /**
   * Get CSS font family string for a font key
   */
  getFontFamily(fontKey: string): string {
    const config = GALLERY_FONTS[fontKey]
    if (!config) return 'serif'
    
    return `"${config.family}", Georgia, serif`
  }
}

// Singleton instance
export const fontLoader = new FontLoader()

// Export font configurations for reference
export { GALLERY_FONTS }
export type { FontConfig }