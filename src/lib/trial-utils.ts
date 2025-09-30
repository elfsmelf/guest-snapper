/**
 * Utility functions for checking free trial status
 */

const TRIAL_DURATION_DAYS = 7

export interface TrialStatus {
  isOnTrial: boolean
  isExpired: boolean
  daysRemaining: number
  expiresAt: Date | null
}

/**
 * Check if an event's free trial has expired
 */
export function getTrialStatus(event: {
  plan?: string | null
  createdAt: string | Date
  paidAt?: string | Date | null
}): TrialStatus {
  const plan = event.plan || 'free_trial'
  const isOnTrial = plan === 'free_trial' || plan === 'free'

  if (!isOnTrial) {
    return {
      isOnTrial: false,
      isExpired: false,
      daysRemaining: 0,
      expiresAt: null
    }
  }

  // If they've already paid, trial is not expired
  if (event.paidAt) {
    return {
      isOnTrial: true,
      isExpired: false,
      daysRemaining: TRIAL_DURATION_DAYS,
      expiresAt: null
    }
  }

  const createdAt = typeof event.createdAt === 'string'
    ? new Date(event.createdAt)
    : event.createdAt

  const expiresAt = new Date(createdAt)
  expiresAt.setDate(expiresAt.getDate() + TRIAL_DURATION_DAYS)

  const now = new Date()
  const isExpired = now > expiresAt

  const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  return {
    isOnTrial: true,
    isExpired,
    daysRemaining,
    expiresAt
  }
}

/**
 * Format trial status as a display string
 */
export function formatTrialStatus(trialStatus: TrialStatus): string {
  if (!trialStatus.isOnTrial) {
    return ''
  }

  if (trialStatus.isExpired) {
    return 'Free Trial - Expired'
  }

  if (trialStatus.daysRemaining === 0) {
    return 'Free Trial - Expires Today'
  }

  if (trialStatus.daysRemaining === 1) {
    return 'Free Trial - 1 Day Left'
  }

  return `Free Trial - ${trialStatus.daysRemaining} Days Left`
}

/**
 * Check if uploads should be blocked
 */
export function canUpload(trialStatus: TrialStatus): boolean {
  if (!trialStatus.isOnTrial) {
    return true // Paid plans can always upload
  }

  return !trialStatus.isExpired // Free trial can upload if not expired
}

/**
 * Check if event can be published
 */
export function canPublish(trialStatus: TrialStatus): boolean {
  if (!trialStatus.isOnTrial) {
    return true // Paid plans can always publish
  }

  return !trialStatus.isExpired // Free trial can publish if not expired
}