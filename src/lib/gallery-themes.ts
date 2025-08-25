export interface GalleryTheme {
  id: string
  name: string
  description: string
  isPrecompiled: boolean
  fontKey?: string // For dynamic font loading
  preview: {
    primary: string
    background: string
    accent: string
    muted: string
  }
  darkPreview: {
    primary: string
    background: string
    accent: string
    muted: string
  }
  lightMode: Record<string, string>
  darkMode: Record<string, string>
}

// Precompiled themes - these use CSS classes for optimal performance
export const PRECOMPILED_THEMES = new Set(['default', 'custom', 'autumn', 'sepia', 'monochrome', 'notebook', 'ocean', 'sunset'])

export const GALLERY_THEMES: Record<string, GalleryTheme> = {
  default: {
    id: 'default',
    name: 'Default',
    description: 'Uses the main application theme styling',
    isPrecompiled: true,
    preview: {
      primary: 'oklch(0.5316 0.1409 355.1999)', // From globals.css --primary
      background: 'oklch(0.9754 0.0084 325.6414)', // From globals.css --background  
      accent: 'oklch(0.8696 0.0675 334.8991)', // From globals.css --accent
      muted: 'oklch(0.9395 0.0260 331.5454)' // From globals.css --muted
    },
    darkPreview: {
      primary: 'oklch(0.7063 0.1440 354.9648)', // From globals.css dark mode --primary
      background: 'oklch(0.1451 0.0184 325.5570)', // From globals.css dark mode --background
      accent: 'oklch(0.2451 0.0453 325.7618)', // From globals.css dark mode --accent
      muted: 'oklch(0.2000 0.0263 325.5570)' // From globals.css dark mode --muted
    },
    lightMode: {}, // Empty for precompiled themes
    darkMode: {}   // Empty for precompiled themes
  },
  custom: {
    id: 'custom',
    name: 'Lavender',
    description: 'Purple and lavender theme with elegant Lora typography',
    isPrecompiled: true,
    fontKey: 'lora',
    preview: {
      primary: 'hsl(260.4000, 22.9358%, 57.2549%)', // Custom theme primary
      background: 'hsl(260, 23.0769%, 97.4510%)', // Custom theme background
      accent: 'hsl(342.4615, 56.5217%, 77.4510%)', // Custom theme accent  
      muted: 'hsl(258.0000, 15.1515%, 87.0588%)' // Custom theme muted
    },
    darkPreview: {
      primary: 'oklch(0.7058 0.0777 302.0489)',
      background: 'oklch(0.2166 0.0215 292.8474)',
      accent: 'oklch(0.3181 0.0321 308.6149)',
      muted: 'oklch(0.2560 0.0320 294.8380)'
    },
    lightMode: {}, // Empty for precompiled themes
    darkMode: {}   // Empty for precompiled themes
  },
  autumn: {
    id: 'autumn',
    name: 'Vintage Paper',
    description: 'Warm earth tones with elegant serif typography',
    isPrecompiled: true,
    fontKey: 'libre-baskerville',
    preview: {
      primary: 'hsl(30.0000, 33.8710%, 48.6275%)', // Warm brown
      background: 'hsl(44.0000, 42.8571%, 93.1373%)', // Cream background
      accent: 'hsl(42.8571, 32.8125%, 74.9020%)', // Warm beige
      muted: 'hsl(39, 34.4828%, 88.6275%)' // Light warm gray
    },
    darkPreview: {
      primary: 'hsl(30, 33.6842%, 62.7451%)',
      background: 'hsl(25.0000, 15.3846%, 15.2941%)',
      accent: 'hsl(24.4444, 17.8808%, 29.6078%)',
      muted: 'hsl(25.7143, 13.7255%, 20%)'
    },
    lightMode: {}, // Empty for precompiled themes
    darkMode: {}   // Empty for precompiled themes
  },
  sepia: {
    id: 'sepia',
    name: 'Sepia Noir',
    description: 'Classic sepia tones with elegant Playfair Display typography',
    isPrecompiled: true,
    fontKey: 'playfair-display',
    preview: {
      primary: 'hsl(20.0000, 14.7982%, 56.2745%)', // Muted brown
      background: 'hsl(25.7143, 63.6364%, 97.8431%)', // Warm cream
      accent: 'hsl(30.5660, 63.8554%, 83.7255%)', // Warm beige
      muted: 'hsl(30, 41.1765%, 93.3333%)' // Light warm muted
    },
    darkPreview: {
      primary: 'hsl(30.5660, 63.8554%, 83.7255%)',
      background: 'hsl(0, 0%, 20.7843%)',
      accent: 'hsl(20.0000, 14.7982%, 56.2745%)',
      muted: 'hsl(0, 0%, 31.3725%)'
    },
    lightMode: {}, // Empty for precompiled themes
    darkMode: {}   // Empty for precompiled themes
  },
  monochrome: {
    id: 'monochrome',
    name: 'Black and White',
    description: 'Classic monochrome aesthetic with clean system typography',
    isPrecompiled: true,
    fontKey: 'system',
    preview: {
      primary: 'hsl(223.8136, 0.0000%, 9.0527%)', // Deep black
      background: 'hsl(223.8136, -172.5242%, 100.0000%)', // Pure white
      accent: 'hsl(223.8136, 0.0002%, 96.0587%)', // Light gray
      muted: 'hsl(223.8136, 0.0002%, 96.0587%)' // Light gray
    },
    darkPreview: {
      primary: 'hsl(223.8136, 0.0001%, 89.8161%)',
      background: 'hsl(223.8136, 0.0000%, 3.9388%)',
      accent: 'hsl(223.8136, 0.0000%, 25.0471%)',
      muted: 'hsl(223.8136, 0.0000%, 14.9382%)'
    },
    lightMode: {}, // Empty for precompiled themes
    darkMode: {}   // Empty for precompiled themes
  },
  notebook: {
    id: 'notebook',
    name: 'Notebook',
    description: 'Handwritten notebook style with playful Architects Daughter font',
    isPrecompiled: true,
    fontKey: 'architects-daughter',
    preview: {
      primary: 'hsl(0, 0%, 37.6471%)', // Dark gray
      background: 'hsl(0, 0%, 97.6471%)', // Light cream
      accent: 'hsl(47.4419, 64.1791%, 86.8627%)', // Warm yellow
      muted: 'hsl(0, 0%, 89.0196%)' // Light gray
    },
    darkPreview: {
      primary: 'hsl(0, 0%, 69.0196%)',
      background: 'hsl(0, 0%, 16.8627%)',
      accent: 'hsl(0, 0%, 87.8431%)',
      muted: 'hsl(0, 0%, 27.0588%)'
    },
    lightMode: {}, // Empty for precompiled themes
    darkMode: {}   // Empty for precompiled themes
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    description: 'Fresh ocean blues with modern Inter and Source Serif 4 typography',
    isPrecompiled: true,
    fontKey: 'inter',
    preview: {
      primary: 'hsl(217.2193, 91.2195%, 59.8039%)', // Ocean blue
      background: 'hsl(0, 0%, 100%)', // Pure white
      accent: 'hsl(204.0000, 93.7500%, 93.7255%)', // Light blue
      muted: 'hsl(210, 20.0000%, 98.0392%)' // Very light blue
    },
    darkPreview: {
      primary: 'hsl(217.2193, 91.2195%, 59.8039%)',
      background: 'hsl(0, 0%, 9.0196%)',
      accent: 'hsl(224.4444, 64.2857%, 32.9412%)',
      muted: 'hsl(0, 0%, 14.9020%)'
    },
    lightMode: {}, // Empty for precompiled themes
    darkMode: {}   // Empty for precompiled themes
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm sunset oranges and corals with Montserrat and Merriweather typography',
    isPrecompiled: true,
    fontKey: 'montserrat',
    preview: {
      primary: 'hsl(11.6250, 100%, 68.6275%)', // Sunset coral
      background: 'hsl(24.0000, 100.0000%, 98.0392%)', // Warm cream
      accent: 'hsl(26.1069, 98.4962%, 73.9216%)', // Warm orange
      muted: 'hsl(15.0000, 100.0000%, 96.0784%)' // Light peach
    },
    darkPreview: {
      primary: 'hsl(11.6250, 100%, 68.6275%)',
      background: 'hsl(336, 13.5135%, 14.5098%)',
      accent: 'hsl(26.1069, 98.4962%, 73.9216%)',
      muted: 'hsl(324, 9.6154%, 20.3922%)'
    },
    lightMode: {}, // Empty for precompiled themes
    darkMode: {}   // Empty for precompiled themes
  }
}

export function getGalleryTheme(themeId: string): GalleryTheme {
  return GALLERY_THEMES[themeId] || GALLERY_THEMES.default
}

export function getGalleryThemeNames(): Array<{id: string, name: string, description: string}> {
  return Object.values(GALLERY_THEMES).map(theme => ({
    id: theme.id,
    name: theme.name,
    description: theme.description
  }))
}