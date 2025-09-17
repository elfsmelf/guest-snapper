import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/database/db'
import { events, albums } from '@/database/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { slug, coupleNames, venue, date, eventType } = body

    if (!slug || !coupleNames) {
      return NextResponse.json(
        { error: 'Slug and couple names are required' },
        { status: 400 }
      )
    }

    // User already exists in Better Auth users table, no need for separate profile

    // Create the event - database defaults handle approveUploads: false, guestCanViewAlbum: true, isPublished: false
    const [newEvent] = await db.insert(events).values({
      userId: session.user.id,
      organizationId: null, // Will be set when organizations are implemented
      name: coupleNames, // Using couple names as the event name
      eventType: eventType || 'wedding', // Default to wedding if not provided
      slug,
      coupleNames,
      venue: venue || null,
      eventDate: date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], // Required field, use current date if not provided
      uploadWindowEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
      downloadWindowEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
    }).returning()

    // Note: Album creation removed for now - table may not exist in actual DB

    return NextResponse.json(newEvent, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}