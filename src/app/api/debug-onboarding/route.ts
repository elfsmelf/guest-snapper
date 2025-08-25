import { NextRequest, NextResponse } from "next/server"
import { db } from "@/database/db"
import { events } from "@/database/schema"
import { eq } from "drizzle-orm"
import { parseOnboardingState, createInitialOnboardingState } from "@/types/onboarding"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug')
  
  if (!slug) {
    return NextResponse.json({ error: 'Slug required' }, { status: 400 })
  }
  
  try {
    // Find event by slug
    const event = await db.select().from(events).where(eq(events.slug, slug)).limit(1)
    
    if (!event[0]) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    const currentState = parseOnboardingState(event[0].quickStartProgress)
    
    return NextResponse.json({
      event: {
        id: event[0].id,
        slug: event[0].slug,
        quickStartProgress: event[0].quickStartProgress
      },
      parsedState: currentState,
      hasOnboarding: !!currentState?.onboardingActive
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Failed to check event' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug')
  
  if (!slug) {
    return NextResponse.json({ error: 'Slug required' }, { status: 400 })
  }
  
  try {
    // Find event by slug
    const event = await db.select().from(events).where(eq(events.slug, slug)).limit(1)
    
    if (!event[0]) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    // Initialize onboarding state
    const initialState = createInitialOnboardingState()
    
    await db.update(events)
      .set({ 
        quickStartProgress: JSON.stringify(initialState),
        updatedAt: new Date().toISOString()
      })
      .where(eq(events.id, event[0].id))
    
    return NextResponse.json({
      success: true,
      message: 'Onboarding initialized',
      state: initialState
    })
  } catch (error) {
    console.error('Init error:', error)
    return NextResponse.json({ error: 'Failed to initialize onboarding' }, { status: 500 })
  }
}