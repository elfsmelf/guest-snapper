import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/database/db'
import { events } from '@/database/schema'
import { and, eq, lt } from 'drizzle-orm'

/**
 * Cron job to automatically trash events that have passed their download window
 * Runs daily at midnight UTC (0 0 * * *)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request from Vercel
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    console.log(`[CRON] Starting trash-expired-events job at ${now.toISOString()}`)

    // Find all active events where downloadWindowEnd has passed
    const expiredEvents = await db
      .select({
        id: events.id,
        name: events.name,
        downloadWindowEnd: events.downloadWindowEnd,
      })
      .from(events)
      .where(
        and(
          eq(events.status, 'active'),
          lt(events.downloadWindowEnd, now.toISOString())
        )
      )

    if (expiredEvents.length === 0) {
      console.log('[CRON] No expired events found')
      return NextResponse.json({
        success: true,
        message: 'No events to trash',
        count: 0
      })
    }

    console.log(`[CRON] Found ${expiredEvents.length} expired events to trash`)

    // Update all expired events to trashed status
    const eventIds = expiredEvents.map(e => e.id)

    for (const eventId of eventIds) {
      await db
        .update(events)
        .set({
          status: 'trashed',
          trashedAt: now.toISOString(),
          updatedAt: now.toISOString()
        })
        .where(eq(events.id, eventId))
    }

    console.log(`[CRON] Successfully trashed ${expiredEvents.length} events`)

    return NextResponse.json({
      success: true,
      message: `Trashed ${expiredEvents.length} expired events`,
      count: expiredEvents.length,
      events: expiredEvents.map(e => ({
        id: e.id,
        name: e.name,
        downloadWindowEnd: e.downloadWindowEnd
      }))
    })

  } catch (error) {
    console.error('[CRON] Error trashing expired events:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to trash expired events',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Disable caching for cron jobs
export const dynamic = 'force-dynamic'
export const revalidate = 0