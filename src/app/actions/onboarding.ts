"use server"

import { db } from "@/database/db"
import { events } from "@/database/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { 
  type OnboardingState, 
  parseOnboardingState,
  createInitialOnboardingState
} from "@/types/onboarding"

// Helper function to validate event access
async function validateEventAccess(eventId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1)
  
  if (!event[0]) {
    throw new Error('Event not found')
  }

  // Check if user owns the event or has organization access
  if (event[0].userId !== session.user.id) {
    // TODO: Add organization member check here
    throw new Error('Access denied')
  }

  return { user: session.user, event: event[0] }
}

// Get current onboarding state - updated to fix server action hash
export async function getOnboardingState(eventId: string): Promise<OnboardingState> {
  console.log('🏁 getOnboardingState called with eventId:', eventId)
  
  try {
    const { event } = await validateEventAccess(eventId)
    console.log('Event found:', event.id, 'quickStartProgress:', event.quickStartProgress)
    
    const state = parseOnboardingState(event.quickStartProgress)
    console.log('Parsed state:', state)
    
    // If no onboarding state exists, create a default one
    if (!state) {
      const defaultState = createInitialOnboardingState()
      console.log('Creating default state:', defaultState)
      return defaultState
    }
    
    console.log('Returning existing state:', state)
    return state
  } catch (error) {
    console.error('Error getting onboarding state:', error)
    // Return default state instead of null
    const defaultState = createInitialOnboardingState()
    console.log('Error fallback - returning default state:', defaultState)
    return defaultState
  }
}

// Initialize onboarding for a new event
export async function initializeOnboarding(eventId: string) {
  try {
    const { event } = await validateEventAccess(eventId)
    
    // Check if onboarding already exists
    const existing = parseOnboardingState(event.quickStartProgress)
    if (existing?.onboardingActive) {
      return { success: true, state: existing }
    }
    
    const initialState = createInitialOnboardingState()
    
    await db.update(events)
      .set({ 
        quickStartProgress: JSON.stringify(initialState),
        updatedAt: new Date().toISOString()
      })
      .where(eq(events.id, eventId))
    
    console.log(`Onboarding step completed for event: ${event.slug}`)
    
    return { success: true, state: initialState }
  } catch (error) {
    console.error('Error initializing onboarding:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to initialize onboarding' 
    }
  }
}

// Update onboarding progress
export async function updateOnboardingProgress(
  eventId: string, 
  updates: Partial<OnboardingState>
) {
  try {
    const { event } = await validateEventAccess(eventId)
    
    // Get current state or create new one
    const currentState = parseOnboardingState(event.quickStartProgress) || createInitialOnboardingState()
    
    // Merge updates
    const updatedState: OnboardingState = {
      ...currentState,
      ...updates,
      lastUpdated: new Date().toISOString()
    }
    
    console.log('[Onboarding Action] Updating progress:', {
      eventId,
      updates,
      currentState,
      updatedState
    })
    
    await db.update(events)
      .set({ 
        quickStartProgress: JSON.stringify(updatedState),
        updatedAt: new Date().toISOString()
      })
      .where(eq(events.id, eventId))
    
    console.log(`Onboarding completed for event: ${event.slug}`)
    
    return { success: true, state: updatedState }
  } catch (error) {
    console.error('Error updating onboarding progress:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update progress' 
    }
  }
}

// Mark a step as complete
export async function completeOnboardingStep(eventId: string, stepId: string) {
  try {
    const { event } = await validateEventAccess(eventId)
    const currentState = parseOnboardingState(event.quickStartProgress) || createInitialOnboardingState()

    // Prevent 'view-gallery' from being marked as complete (it's the final action, not a completable step)
    if (stepId === 'view-gallery') {
      return { success: true, state: currentState }
    }

    // Add step to completed steps if not already there
    const completedSteps = currentState.completedSteps.includes(stepId)
      ? currentState.completedSteps
      : [...currentState.completedSteps, stepId]

    // Remove from skipped steps if it was there
    const skippedSteps = currentState.skippedSteps.filter(id => id !== stepId)

    return updateOnboardingProgress(eventId, {
      completedSteps,
      skippedSteps
    })
  } catch (error) {
    console.error('Error completing onboarding step:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete step'
    }
  }
}

// Skip a step
export async function skipOnboardingStep(eventId: string, stepId: string) {
  try {
    const { event } = await validateEventAccess(eventId)
    const currentState = parseOnboardingState(event.quickStartProgress) || createInitialOnboardingState()
    
    // Add step to skipped steps if not already there
    const skippedSteps = currentState.skippedSteps.includes(stepId) 
      ? currentState.skippedSteps 
      : [...currentState.skippedSteps, stepId]
    
    return updateOnboardingProgress(eventId, {
      skippedSteps
    })
  } catch (error) {
    console.error('Error skipping onboarding step:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to skip step' 
    }
  }
}

// Skip entire onboarding
export async function skipOnboarding(eventId: string, permanent: boolean = false) {
  try {
    const updates: Partial<OnboardingState> = {
      onboardingActive: false,
      onboardingSkipped: true,
      onboardingComplete: permanent,
      lastUpdated: new Date().toISOString()
    }
    
    if (permanent) {
      updates.onboardingCompletedAt = new Date().toISOString()
    }
    
    return updateOnboardingProgress(eventId, updates)
  } catch (error) {
    console.error('Error skipping onboarding:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to skip onboarding' 
    }
  }
}

// Complete onboarding
export async function completeOnboarding(eventId: string) {
  try {
    return updateOnboardingProgress(eventId, {
      onboardingActive: false,
      onboardingComplete: true,
      onboardingCompletedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error completing onboarding:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to complete onboarding' 
    }
  }
}

// Resume onboarding
export async function resumeOnboarding(eventId: string) {
  try {
    return updateOnboardingProgress(eventId, {
      onboardingActive: true,
      onboardingSkipped: false
    })
  } catch (error) {
    console.error('Error resuming onboarding:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to resume onboarding' 
    }
  }
}

// Update current step
export async function updateOnboardingStep(eventId: string, step: number) {
  try {
    return updateOnboardingProgress(eventId, {
      currentStep: step,
      lastActiveStep: step
    })
  } catch (error) {
    console.error('Error updating onboarding step:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update step' 
    }
  }
}