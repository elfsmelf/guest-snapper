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
  const plan = event.plan || 'free_trial'
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
  const plan = event.plan || 'free_trial'
  const features = getPlanFeatures(plan)
  
  if (!features.publicAccess) {
    return {
      allowed: false,
      reason: 'Free galleries cannot be made public. Upgrade to publish your gallery.',
      suggestedPlan: 'bliss',
      upgradeRequired: true
    }
  }
  
  return {
    allowed: true,
    upgradeRequired: false
  }
}

/**
 * Check if event has storage capacity for upload
 */
export function canAcceptUpload(event: EventForFeatureGating, currentStorageMB: number, fileSizeMB: number): FeatureGateResult {
  const plan = event.plan || 'free_trial'
  const features = getPlanFeatures(plan)

  // Check individual file size limit
  if (fileSizeMB > features.maxFileSizeMB) {
    return {
      allowed: false,
      reason: `File exceeds ${features.maxFileSizeMB}MB limit. Your ${features.name} allows files up to ${features.maxFileSizeMB}MB each.`,
      currentLimit: features.maxFileSizeMB,
      suggestedPlan: plan === 'free_trial' ? 'bliss' : undefined,
      upgradeRequired: plan === 'free_trial'
    }
  }

  // Check total storage limit (only enforced for trial)
  if (features.storageLimit !== 999999) {
    const wouldExceedLimit = (currentStorageMB + fileSizeMB) > features.storageLimit

    if (wouldExceedLimit) {
      return {
        allowed: false,
        reason: `Storage limit exceeded. You have used ${currentStorageMB.toFixed(1)}MB of ${features.storageLimit}MB. This file would exceed your limit. Upgrade to get unlimited storage.`,
        currentLimit: features.storageLimit,
        suggestedPlan: 'bliss',
        upgradeRequired: true
      }
    }
  }

  return {
    allowed: true,
    upgradeRequired: false
  }
}

/**
 * Check if more guests can upload to event
 * Note: All paid plans now have unlimited guests, so this mainly handles free trial limits
 */
export function canAcceptMoreGuests(event: EventForFeatureGating, currentGuestCount: number): FeatureGateResult {
  const plan = event.plan || 'free_trial'
  const features = getPlanFeatures(plan)

  // All paid plans have unlimited guests
  if (plan !== 'free_trial' && features.guestLimit === 999999) {
    return {
      allowed: true,
      upgradeRequired: false
    }
  }

  // For free trial, there might still be some practical limits
  if (plan === 'free_trial' && currentGuestCount >= 50) {
    return {
      allowed: true,
      reason: `You have ${currentGuestCount} guests on your free trial. Consider upgrading to a paid plan for the best experience.`,
      suggestedPlan: 'bliss',
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
  const plan = event.plan || 'free_trial'
  const features = getPlanFeatures(plan)

  if (!features.videoGuestbook) {
    return {
      allowed: false,
      reason: 'Video guestbook is available on all paid plans.',
      suggestedPlan: 'bliss',
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
  const plan = event.plan || 'free_trial'
  const features = getPlanFeatures(plan)

  if (!features.customBranding) {
    return {
      allowed: false,
      reason: 'Custom branding is available on the Eternal plan.',
      suggestedPlan: 'eternal',
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
  const plan = event.plan || 'free_trial'
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
  const plan = event.plan || 'free_trial'
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
  if (requiredAlbums <= 1) return 'bliss'
  if (requiredAlbums <= 9) return 'radiance'
  return 'eternal'
}

function getSuggestedPlanForGuests(requiredGuests: number): Plan {
  // All plans have unlimited guests now, so suggest based on other factors
  return 'bliss' // Start with the most basic paid plan
}

function getSuggestedPlanForThemes(requiredThemes: number): Plan {
  if (requiredThemes <= 1) return 'bliss'
  if (requiredThemes <= 25) return 'radiance'
  return 'eternal'
}

/**
 * Check if user should see upgrade suggestions
 */
export function shouldShowUpgradeSuggestion(event: EventForFeatureGating, stats: {
  albumCount: number
  guestCount: number
}): { show: boolean, suggestion?: { feature: string, plan: Plan, reason: string } } {
  const plan = event.plan || 'free_trial'
  const features = getPlanFeatures(plan)

  // Don't suggest upgrades for the highest plan
  if (plan === 'eternal') {
    return { show: false }
  }

  // Suggest upgrade when approaching album limits
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

  // For free trial users, suggest upgrading after some usage
  if (plan === 'free_trial' && stats.guestCount > 10) {
    return {
      show: true,
      suggestion: {
        feature: 'upgrade',
        plan: 'bliss',
        reason: `You have ${stats.guestCount} guests! Upgrade to unlock all features and extended access.`
      }
    }
  }

  return { show: false }
}