import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/database/db'
import { albums, events } from '@/database/schema'
import { eq, max, count } from 'drizzle-orm'
import { canUserAccessEvent } from '@/lib/auth-helpers'
import { canCreateAlbum } from '@/lib/feature-gates'

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

    const { id: eventId } = await params
    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Album name is required' }, { status: 400 })
    }

    // Verify the user can access this event and get event details for plan checking
    const hasAccess = await canUserAccessEvent(eventId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get event details for plan checking
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)
      .then(results => results[0])

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get current album count
    const albumCountResult = await db
      .select({ count: count() })
      .from(albums)
      .where(eq(albums.eventId, eventId))

    const currentAlbumCount = albumCountResult[0]?.count || 0

    // Check if user can create another album based on their plan
    const albumCheck = canCreateAlbum({
      id: eventId,
      plan: event.plan,
      guestCount: event.guestCount || 0,
      isPublished: event.isPublished
    }, currentAlbumCount)

    if (!albumCheck.allowed) {
      return NextResponse.json({ 
        error: albumCheck.reason,
        requiresUpgrade: albumCheck.upgradeRequired,
        suggestedPlan: albumCheck.suggestedPlan,
        currentLimit: albumCheck.currentLimit,
        currentCount: currentAlbumCount
      }, { status: 403 })
    }

    // Get the highest sort order for this event
    const maxSortOrderResult = await db
      .select({ maxSortOrder: max(albums.sortOrder) })
      .from(albums)
      .where(eq(albums.eventId, eventId))

    const nextSortOrder = (maxSortOrderResult[0]?.maxSortOrder || 0) + 1

    // Create the album
    const newAlbum = await db
      .insert(albums)
      .values({
        eventId,
        name: name.trim(),
        description: description?.trim() || null,
        isDefault: false,
        sortOrder: nextSortOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json({
      success: true,
      album: newAlbum[0]
    })

  } catch (error) {
    console.error('Album creation failed:', error)
    return NextResponse.json({ error: 'Failed to create album' }, { status: 500 })
  }
}

export async function GET(
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

    const { id: eventId } = await params

    // Verify the user can access this event
    const hasAccess = await canUserAccessEvent(eventId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get all albums for this event
    const eventAlbums = await db
      .select()
      .from(albums)
      .where(eq(albums.eventId, eventId))
      .orderBy(albums.sortOrder, albums.name)

    return NextResponse.json({
      success: true,
      albums: eventAlbums
    })

  } catch (error) {
    console.error('Failed to fetch albums:', error)
    return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 })
  }
}