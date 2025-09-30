// Onboarding state stored in the database (events.quickStartProgress)
export interface OnboardingState {
  // Core onboarding status
  onboardingActive: boolean        // Currently in onboarding flow
  onboardingComplete: boolean      // User completed all steps
  onboardingSkipped: boolean       // User explicitly skipped onboarding
  onboardingStartedAt: string      // When onboarding began
  onboardingCompletedAt?: string   // When finished/skipped
  
  // Progress tracking
  currentStep: number               // Current step (1-10)
  completedSteps: string[]          // Array of completed step IDs
  skippedSteps: string[]           // Array of skipped step IDs
  
  // Individual step completion flags
  testImagesUploaded: boolean
  testImageCount: number
  coverPhotoUploaded: boolean
  coverPhotoSet: boolean
  coverPhotoUrl?: string
  privacyConfigured: boolean
  privacySettings?: {
    guestCanView: boolean
    approveUploads: boolean
  }
  themeSelected: boolean
  selectedThemeId?: string
  guestCountSet: boolean
  guestCount?: number
  paymentCompleted: boolean
  paymentPlan?: string
  eventPublished: boolean
  publishedAt?: string
  albumsCreated: number
  albumIds: string[]
  qrDownloaded: boolean
  qrDownloadedAt?: string
  slideshowTested: boolean
  slideshowTestedAt?: string
  collaboratorsInvited: number
  collaboratorEmails: string[]
  
  // Resume capability
  lastActiveStep: number
  lastUpdated: string
}

// Step definitions for the onboarding wizard
export interface OnboardingStep {
  id: string
  number: number
  title: string
  description: string
  isRequired: boolean
  isComplete: boolean
  isSkipped: boolean
}

// Onboarding step IDs
export const ONBOARDING_STEPS = {
  TEST_IMAGES: 'test-images',
  PRIVACY: 'privacy',
  THEME: 'theme',
  GUEST_COUNT: 'guest-count',
  PUBLISH: 'publish',
  ALBUMS: 'albums',
  QR_CODE: 'qr-code',
  SLIDESHOW: 'slideshow',
  COLLABORATORS: 'collaborators'
} as const

export type OnboardingStepId = typeof ONBOARDING_STEPS[keyof typeof ONBOARDING_STEPS]

// Helper to create initial onboarding state
export function createInitialOnboardingState(): OnboardingState {
  return {
    onboardingActive: true,
    onboardingComplete: false,
    onboardingSkipped: false,
    onboardingStartedAt: new Date().toISOString(),
    currentStep: 1,
    completedSteps: [],
    skippedSteps: [],
    testImagesUploaded: false,
    testImageCount: 0,
    coverPhotoUploaded: false,
    coverPhotoSet: false,
    privacyConfigured: false,
    themeSelected: false,
    guestCountSet: false,
    paymentCompleted: false,
    eventPublished: false,
    albumsCreated: 0,
    albumIds: [],
    qrDownloaded: false,
    slideshowTested: false,
    collaboratorsInvited: 0,
    collaboratorEmails: [],
    lastActiveStep: 1,
    lastUpdated: new Date().toISOString()
  }
}

// Helper to parse onboarding state from database
export function parseOnboardingState(quickStartProgress: string | null): OnboardingState | null {
  if (!quickStartProgress) return null
  
  try {
    const parsed = JSON.parse(quickStartProgress)
    // Only return if it has onboarding fields
    if ('onboardingActive' in parsed) {
      return parsed as OnboardingState
    }
    return null
  } catch {
    return null
  }
}