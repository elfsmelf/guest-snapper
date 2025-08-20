import { NextRequest, NextResponse } from 'next/server'
import { moveExpiredEventsToTrash, permanentlyDeleteTrashedEvents, getScheduledDeletionStatus } from '@/lib/scheduled-deletion-service'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current status for reporting
    const statusBefore = await getScheduledDeletionStatus()
    
    console.log('Starting scheduled deletion job...')
    console.log('Status before:', statusBefore)

    const results = {
      timestamp: new Date().toISOString(),
      statusBefore,
      trashResults: null as any,
      deleteResults: null as any,
      statusAfter: null as any,
      totalProcessed: 0,
      errors: [] as string[]
    }

    // Step 1: Move expired events to trash
    console.log('Moving expired events to trash...')
    const trashResults = await moveExpiredEventsToTrash()
    results.trashResults = trashResults
    results.totalProcessed += trashResults.eventsProcessed
    results.errors.push(...trashResults.errors)

    // Step 2: Permanently delete trashed events
    console.log('Permanently deleting trashed events...')
    const deleteResults = await permanentlyDeleteTrashedEvents()
    results.deleteResults = deleteResults
    results.totalProcessed += deleteResults.eventsProcessed
    results.errors.push(...deleteResults.errors)

    // Get final status
    const statusAfter = await getScheduledDeletionStatus()
    results.statusAfter = statusAfter

    console.log('Scheduled deletion job completed')
    console.log('Total events processed:', results.totalProcessed)
    console.log('Status after:', statusAfter)

    if (results.errors.length > 0) {
      console.error('Errors during scheduled deletion:', results.errors)
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      ...results
    })

  } catch (error) {
    console.error('Scheduled deletion job failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Scheduled deletion job failed',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Allow manual triggering for testing (with proper auth)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'status') {
      const status = await getScheduledDeletionStatus()
      return NextResponse.json({ success: true, status })
    }

    if (action === 'trash') {
      const results = await moveExpiredEventsToTrash()
      return NextResponse.json({ success: results.success, results })
    }

    if (action === 'delete') {
      const results = await permanentlyDeleteTrashedEvents()
      return NextResponse.json({ success: results.success, results })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Manual scheduled deletion failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Operation failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}