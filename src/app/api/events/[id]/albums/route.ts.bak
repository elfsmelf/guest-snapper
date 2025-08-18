import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/database/db'
import { albums } from '@/database/schema'
import { eq, max } from 'drizzle-orm'
import { canUserAccessEvent } from '@/lib/auth-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user || session.user.isAnonymous) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: eventId } = await params
    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Album name is required' }, { status: 400 })
    }

    // Verify the user can access this event
    const hasAccess = await canUserAccessEvent(eventId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
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

    if (!session?.user || session.user.isAnonymous) {
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