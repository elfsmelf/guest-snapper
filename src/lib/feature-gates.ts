import { getPlanFeatures } from './pricing'
import type { Plan } from './pricing'

// Event data structure for feature checking
export interface EventForFeatureGating {
  id: string
  plan?: string | null
  guestCount?: number
  albumCount?: number // This would need to be passed from queries
  isPublished?: boolean
  currency?: string
}

// Feature gate result with upgrade information
export interface FeatureGateResult {
  allowed: boolean
  reason?: string
  currentLimit?: number
  suggestedPlan?: Plan
  upgradeRequired: boolean
}

/**
 * Check if user can create a new album for an event
 */
export function canCreateAlbum(event: EventForFeatureGating, currentAlbumCount: number): FeatureGateResult {
  const plan = event.plan || 'free'
  const features = getPlanFeatures(plan)
  
  if (currentAlbumCount >= features.albumLimit) {
    const suggestedPlan = getSuggestedPlanForAlbums(currentAlbumCount + 1)
    
    return {
      allowed: false,
      reason: `Your ${features.name} allows ${features.albumLimit === 999999 ? 'unlimited' : features.albumLimit} album${features.albumLimit === 1 ? '' : 's'}. You currently have ${currentAlbumCount}.`,
      currentLimit: features.albumLimit,
      suggestedPlan,
      upgradeRequired: true
    }
  }
  
  return {
    allowed: true,
    upgradeRequired: false
  }
}

/**
 * Check if event can be published
 */
export function canPublishEvent(event: EventForFeatureGating): FeatureGateResult {
  const plan = event.plan || 'free'
  const features = getPlanFeatures(plan)
  
  if (!features.publicAccess) {
    return {
      allowed: false,
      reason: 'Free trial galleries cannot be made public. Upgrade to publish your gallery.',
      suggestedPlan: 'starter',
      upgradeRequired: true
    }
  }
  
  return {
    allowed: true,
    upgradeRequired: false
  }
}

/**
 * Check if more guests can upload to event
 */
export function canAcceptMoreGuests(event: EventForFeatureGating, currentGuestCount: number): FeatureGateResult {
  const plan = event.plan || 'free'
  const features = getPlanFeatures(plan)
  
  if (currentGuestCount >= features.guestLimit) {
    const suggestedPlan = getSuggestedPlanForGuests(currentGuestCount + 10) // Add buffer
    
    return {
      allowed: false,
      reason: `Your ${features.name} supports up to ${features.guestLimit === 999999 ? 'unlimited' : features.guestLimit} guests. You currently have ${currentGuestCount}.`,
      currentLimit: features.guestLimit,
      suggestedPlan,
      upgradeRequired: true
    }
  }
  
  // Warn when approaching limit (80% capacity)
  const warningThreshold = Math.floor(features.guestLimit * 0.8)
  if (currentGuestCount >= warningThreshold && features.guestLimit !== 999999) {
    const suggestedPlan = getSuggestedPlanForGuests(features.guestLimit + 10)
    
    return {
      allowed: true,
      reason: `You're approaching your guest limit (${currentGuestCount}/${features.guestLimit}). Consider upgrading for more capacity.`,
      currentLimit: features.guestLimit,
      suggestedPlan,
      upgradeRequired: false
    }
  }
  
  return {
    allowed: true,
    upgradeRequired: false
  }
}

/**
 * Check if user can access video guestbook feature
 */
export function canUseVideoGuestbook(event: EventForFeatureGating): FeatureGateResult {
  const plan = event.plan || 'free'
  const features = getPlanFeatures(plan)
  
  if (!features.videoGuestbook) {
    return {
      allowed: false,
      reason: 'Video guestbook is available on Medium plans and above.',
      suggestedPlan: 'medium',
      upgradeRequired: true
    }
  }
  
  return {
    allowed: true,
    upgradeRequired: false
  }
}

/**
 * Check if user can access custom branding features
 */
export function canUseCustomBranding(event: EventForFeatureGating): FeatureGateResult {
  const plan = event.plan || 'free'
  const features = getPlanFeatures(plan)
  
  if (!features.customBranding) {
    return {
      allowed: false,
      reason: 'Custom branding is available on XLarge plans and above.',
      suggestedPlan: 'xlarge',
      upgradeRequired: true
    }
  }
  
  return {
    allowed: true,
    upgradeRequired: false
  }
}

/**
 * Check theme access based on plan
 */
export function canUseTheme(event: EventForFeatureGating, themeIndex: number): FeatureGateResult {
  const plan = event.plan || 'free'
  const features = getPlanFeatures(plan)
  
  // Theme index 0 is always available (default theme)
  if (themeIndex === 0) {
    return {
      allowed: true,
      upgradeRequired: false
    }
  }
  
  if (themeIndex >= features.themeLimit) {
    const suggestedPlan = getSuggestedPlanForThemes(themeIndex + 1)
    
    return {
      allowed: false,
      reason: `Your ${features.name} includes ${features.themeLimit === 999999 ? 'all' : features.themeLimit} theme${features.themeLimit === 1 ? '' : 's'}. This theme requires a higher plan.`,
      suggestedPlan,
      upgradeRequired: true
    }
  }
  
  return {
    allowed: true,
    upgradeRequired: false
  }
}

/**
 * Get plan usage summary for an event
 */
export function getPlanUsageSummary(event: EventForFeatureGating, stats: {
  albumCount: number
  guestCount: number
  uploadCount: number
}) {
  const plan = event.plan || 'free'
  const features = getPlanFeatures(plan)
  
  return {
    plan: features.name,
    albums: {
      used: stats.albumCount,
      limit: features.albumLimit,
      unlimited: features.albumLimit === 999999,
      percentage: features.albumLimit === 999999 ? 0 : Math.round((stats.albumCount / features.albumLimit) * 100)
    },
    guests: {
      used: stats.guestCount,
      limit: features.guestLimit,
      unlimited: features.guestLimit === 999999,
      percentage: features.guestLimit === 999999 ? 0 : Math.round((stats.guestCount / features.guestLimit) * 100)
    },
    features: {
      publicAccess: features.publicAccess,
      videoGuestbook: features.videoGuestbook,
      customBranding: features.customBranding,
      themeLimit: features.themeLimit,
      uploadWindowMonths: features.uploadWindowMonths
    }
  }
}

// Helper functions to suggest appropriate plans

function getSuggestedPlanForAlbums(requiredAlbums: number): Plan {
  if (requiredAlbums <= 1) return 'starter'
  if (requiredAlbums <= 2) return 'small'
  if (requiredAlbums <= 3) return 'medium'
  if (requiredAlbums <= 5) return 'large'
  if (requiredAlbums <= 10) return 'xlarge'
  return 'unlimited'
}

function getSuggestedPlanForGuests(requiredGuests: number): Plan {
  if (requiredGuests <= 10) return 'starter'
  if (requiredGuests <= 25) return 'small'
  if (requiredGuests <= 50) return 'medium'
  if (requiredGuests <= 100) return 'large'
  if (requiredGuests <= 200) return 'xlarge'
  return 'unlimited'
}

function getSuggestedPlanForThemes(requiredThemes: number): Plan {
  if (requiredThemes <= 1) return 'starter'
  if (requiredThemes <= 5) return 'small'
  if (requiredThemes <= 10) return 'medium'
  if (requiredThemes <= 15) return 'large'
  return 'xlarge' // XLarge and unlimited both have 15+ themes
}

/**
 * Check if user should see upgrade suggestions
 */
export function shouldShowUpgradeSuggestion(event: EventForFeatureGating, stats: {
  albumCount: number
  guestCount: number
}): { show: boolean, suggestion?: { feature: string, plan: Plan, reason: string } } {
  const plan = event.plan || 'free'
  const features = getPlanFeatures(plan)
  
  // Don't suggest upgrades for unlimited plan
  if (plan === 'unlimited') {
    return { show: false }
  }
  
  // Suggest upgrade when approaching limits
  if (features.albumLimit !== 999999 && stats.albumCount >= features.albumLimit * 0.8) {
    return {
      show: true,
      suggestion: {
        feature: 'albums',
        plan: getSuggestedPlanForAlbums(features.albumLimit + 1),
        reason: `You're using ${stats.albumCount} of ${features.albumLimit} albums. Upgrade for more capacity.`
      }
    }
  }
  
  if (features.guestLimit !== 999999 && stats.guestCount >= features.guestLimit * 0.8) {
    return {
      show: true,
      suggestion: {
        feature: 'guests',
        plan: getSuggestedPlanForGuests(features.guestLimit + 10),
        reason: `You have ${stats.guestCount} of ${features.guestLimit} guests. Upgrade for more capacity.`
      }
    }
  }
  
  return { show: false }
}