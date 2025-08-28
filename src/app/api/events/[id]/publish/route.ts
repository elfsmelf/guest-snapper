import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/database/db'
import { events } from '@/database/schema'
import { eq } from 'drizzle-orm'
import { addMonths } from 'date-fns'
import { validateEventAccess } from '@/lib/auth-helpers'
import { canPublishEvent } from '@/lib/feature-gates'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify the user can access this event (owner or organization member)
    let event
    try {
      const result = await validateEventAccess(id, session.user.id)
      event = result.event
    } catch (error) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if already published
    if (event.isPublished) {
      return NextResponse.json({ error: 'Event is already published' }, { status: 400 })
    }

    // Check if activation date is set
    if (!event.activationDate) {
      return NextResponse.json({ error: 'Activation date must be set before publishing' }, { status: 400 })
    }

    // Check if event can be published based on plan
    const publishCheck = canPublishEvent({
      id: event.id,
      plan: event.plan,
      guestCount: event.guestCount || 0,
      isPublished: event.isPublished
    })

    if (!publishCheck.allowed) {
      return NextResponse.json({ 
        error: publishCheck.reason || 'Cannot publish event with current plan',
        requiresUpgrade: publishCheck.upgradeRequired,
        suggestedPlan: publishCheck.suggestedPlan
      }, { status: 403 })
    }

    const activationDate = new Date(event.activationDate)
    const uploadWindowEnd = addMonths(activationDate, 3)
    const downloadWindowEnd = addMonths(activationDate, 12)
    const publishedAt = new Date()

    // Update the event to published status and set the windows
    const updatedEvent = await db
      .update(events)
      .set({
        isPublished: true,
        publishedAt: publishedAt.toISOString(),
        uploadWindowEnd: uploadWindowEnd.toISOString(),
        downloadWindowEnd: downloadWindowEnd.toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(events.id, id))
      .returning()

    // Revalidate the gallery page cache when event is published
    // This ensures the gallery immediately reflects the published status
    console.log(`Event published: ${event.slug}`)

    return NextResponse.json({
      success: true,
      event: updatedEvent[0]
    })

  } catch (error) {
    console.error('Event publishing failed:', error)
    return NextResponse.json({ error: 'Failed to publish event' }, { status: 500 })
  }
}