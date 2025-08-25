"use server"

import { db } from "@/database/db"
import { events } from "@/database/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

// Type definition for quick start progress
export interface QuickStartProgress {
  qrDownloaded?: boolean
  slideshowTested?: boolean
  stepsSkipped?: string[]
  lastUpdated?: string
}

// Helper function to get current user and validate access
async function validateEventAccess(eventId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  // Check if user owns the event or has access
  const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1)
  
  if (!event[0]) {
    throw new Error('Event not found')
  }

  if (event[0].userId !== session.user.id) {
    throw new Error('Access denied')
  }

  return { user: session.user, event: event[0] }
}

// Helper function to parse and merge progress
function parseProgress(currentProgress: string): QuickStartProgress {
  try {
    return JSON.parse(currentProgress || '{}')
  } catch {
    return {}
  }
}

// Mark QR code as downloaded
export async function markQRDownloaded(eventId: string) {
  try {
    const { event } = await validateEventAccess(eventId)
    
    const currentProgress = parseProgress(event.quickStartProgress)
    const updatedProgress: QuickStartProgress = {
      ...currentProgress,
      qrDownloaded: true,
      lastUpdated: new Date().toISOString()
    }

    await db.update(events)
      .set({ 
        quickStartProgress: JSON.stringify(updatedProgress),
        updatedAt: new Date().toISOString()
      })
      .where(eq(events.id, eventId))

    revalidatePath(`/dashboard/events/${eventId}`)
    return { success: true }
  } catch (error) {
    console.error('Error marking QR as downloaded:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Mark slideshow as tested
export async function markSlideshowTested(eventId: string) {
  try {
    const { event } = await validateEventAccess(eventId)
    
    const currentProgress = parseProgress(event.quickStartProgress)
    const updatedProgress: QuickStartProgress = {
      ...currentProgress,
      slideshowTested: true,
      lastUpdated: new Date().toISOString()
    }

    await db.update(events)
      .set({ 
        quickStartProgress: JSON.stringify(updatedProgress),
        updatedAt: new Date().toISOString()
      })
      .where(eq(events.id, eventId))

    revalidatePath(`/dashboard/events/${eventId}`)
    return { success: true }
  } catch (error) {
    console.error('Error marking slideshow as tested:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Mark step as skipped/completed
export async function markStepCompleted(eventId: string, stepId: string, isSkipped = false) {
  try {
    const { event } = await validateEventAccess(eventId)
    
    const currentProgress = parseProgress(event.quickStartProgress)
    const stepsSkipped = currentProgress.stepsSkipped || []
    
    let updatedStepsSkipped = stepsSkipped
    if (isSkipped && !stepsSkipped.includes(stepId)) {
      updatedStepsSkipped = [...stepsSkipped, stepId]
    } else if (!isSkipped) {
      updatedStepsSkipped = stepsSkipped.filter(id => id !== stepId)
    }

    const updatedProgress: QuickStartProgress = {
      ...currentProgress,
      stepsSkipped: updatedStepsSkipped,
      lastUpdated: new Date().toISOString()
    }

    await db.update(events)
      .set({ 
        quickStartProgress: JSON.stringify(updatedProgress),
        updatedAt: new Date().toISOString()
      })
      .where(eq(events.id, eventId))

    revalidatePath(`/dashboard/events/${eventId}`)
    return { success: true }
  } catch (error) {
    console.error('Error marking step as completed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Get quick start progress for an event
export async function getQuickStartProgress(eventId: string): Promise<QuickStartProgress> {
  try {
    const { event } = await validateEventAccess(eventId)
    return parseProgress(event.quickStartProgress)
  } catch (error) {
    console.error('Error getting quick start progress:', error)
    return {}
  }
}