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
    const { slug, name, venue, date, eventType } = body

    if (!slug || !name) {
      return NextResponse.json(
        { error: 'Slug and event name are required' },
        { status: 400 }
      )
    }

    // User already exists in Better Auth users table, no need for separate profile

    // Create the event - database defaults handle approveUploads: false, guestCanViewAlbum: true, isPublished: false
    const [newEvent] = await db.insert(events).values({
      userId: session.user.id,
      organizationId: null, // Will be set when organizations are implemented
      name: name, // Using provided event name
      eventType: eventType || 'wedding', // Default to wedding if not provided
      slug,
      coupleNames: name, // Use name for backward compatibility
      venue: venue || null,
      eventDate: date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], // Required field, use current date if not provided
      uploadWindowEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
      downloadWindowEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      plan: 'free_trial', // All new events start with free trial
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