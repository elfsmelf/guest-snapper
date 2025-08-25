"use client"

// Quick start progress interface
interface QuickStartProgress {
  qrDownloaded?: boolean
  slideshowTested?: boolean
  stepsSkipped?: string[]
  lastUpdated?: string
}

// Event interface based on schema
interface Event {
  id: string
  coverImageUrl?: string | null
  guestCount: number
  guestCanViewAlbum: boolean
  approveUploads: boolean
  activationDate?: string | null
  isPublished: boolean
  themeId: string
  plan?: string
  organizationId?: string | null
  quickStartProgress?: string
}

// Organization interface for collaborators
interface Organization {
  id: string
  name: string
  members?: Array<{
    id: string
    role: string
  }>
}

export type StepStatus = 'completed' | 'incomplete' | 'optional-completed' | 'optional-skipped'

// Helper function to parse quick start progress
function parseQuickStartProgress(progressString?: string): QuickStartProgress {
  try {
    return JSON.parse(progressString || '{}')
  } catch {
    return {}
  }
}

/**
 * Check if cover photo has been uploaded
 */
export function checkCoverPhotoStatus(event: Event): StepStatus {
  return event.coverImageUrl ? 'completed' : 'incomplete'
}

/**
 * Check if guest count has been set beyond free tier
 */
export function checkGuestCountStatus(event: Event): StepStatus {
  // Consider it complete if they've upgraded from the default free tier (8 guests)
  return event.guestCount > 8 ? 'completed' : 'incomplete'
}

/**
 * Check if privacy settings have been configured
 * We consider this complete if settings have been explicitly set (non-default)
 */
export function checkPrivacySettingsStatus(event: Event): StepStatus {
  // Since these have defaults, we'll consider them "completed" if the user has any non-free plan
  // or if they've published (indicating they've reviewed settings)
  const hasReviewedSettings = event.isPublished || (event.plan && event.plan !== 'free')
  return hasReviewedSettings ? 'completed' : 'incomplete'
}

/**
 * Check if activation date is set and event is published
 */
export function checkPublicationStatus(event: Event): StepStatus {
  return event.activationDate && event.isPublished ? 'completed' : 'incomplete'
}

/**
 * Check if a custom theme has been selected (optional step)
 */
export function checkThemeSelectionStatus(event: Event): StepStatus {
  return event.themeId !== 'default' ? 'optional-completed' : 'incomplete'
}

/**
 * Check if test photos have been uploaded (client-side check using passed data)
 */
export function checkTestPhotosStatus(photoCount: number): StepStatus {
  return photoCount > 0 ? 'completed' : 'incomplete'
}


/**
 * Check if QR code has been downloaded (database check)
 */
export function checkQRDownloadStatus(event: Event): StepStatus {
  const progress = parseQuickStartProgress(event.quickStartProgress)
  return progress.qrDownloaded ? 'optional-completed' : 'incomplete'
}

/**
 * Check if slideshow has been tested (database check)
 */
export function checkSlideshowTestStatus(event: Event): StepStatus {
  const progress = parseQuickStartProgress(event.quickStartProgress)
  return progress.slideshowTested ? 'optional-completed' : 'incomplete'
}

/**
 * Check if a step has been skipped (database check)
 */
export function checkStepSkippedStatus(stepId: string, event: Event): boolean {
  const progress = parseQuickStartProgress(event.quickStartProgress)
  return progress.stepsSkipped?.includes(stepId) || false
}

/**
 * Check if collaborators have been added (optional step)
 */
export function checkCollaboratorsStatus(organization: Organization | null): StepStatus {
  if (!organization) return 'incomplete'
  
  // Check if there are members beyond the owner
  const memberCount = organization.members?.length || 0
  return memberCount > 1 ? 'optional-completed' : 'incomplete'
}


/**
 * Calculate overall progress based on step completion
 */
export function calculateProgress(steps: { status: StepStatus; isRequired: boolean; weight: number }[]): number {
  let totalWeight = 0
  let completedWeight = 0
  
  steps.forEach(step => {
    totalWeight += step.weight
    
    if (step.status === 'completed' || step.status === 'optional-completed') {
      completedWeight += step.weight
    } else if (step.status === 'optional-skipped') {
      // Optional skipped steps don't count toward total weight
      totalWeight -= step.weight
    }
  })
  
  return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0
}

/**
 * Get completion message based on progress
 */
export function getCompletionMessage(progress: number, requiredComplete: boolean): string {
  if (progress === 100) {
    return "Setup complete! 🎉"
  } else if (requiredComplete) {
    return "Ready to publish!"
  } else if (progress >= 75) {
    return "Almost there!"
  } else if (progress >= 50) {
    return "Good progress!"
  } else if (progress >= 25) {
    return "Getting started!"
  }
  return "Let's get started!"
}