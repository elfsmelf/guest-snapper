import { parseAsBoolean, parseAsInteger } from 'nuqs'

// Gallery-specific search params
export const galleryParams = {
  // Welcome dialog state
  showWelcome: parseAsBoolean.withDefault(false),
  welcomeStep: parseAsInteger.withDefault(3),
  
  // Other gallery state can be added here
  // view: parseAsStringLiteral(['grid', 'list']).withDefault('grid'),
  // album: parseAsString.withDefault('all'),
} as const

// Shorter URL keys
export const galleryUrlKeys = {
  showWelcome: 'w',
  welcomeStep: 'ws',
} as const

export type GallerySearchParams = {
  [K in keyof typeof galleryParams]: ReturnType<typeof galleryParams[K]['parseServerSide']>
}