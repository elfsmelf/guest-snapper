import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { restoreEventFromTrash } from '@/lib/scheduled-deletion-service'

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

    // Restore the event from trash
    const result = await restoreEventFromTrash(id, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Event successfully restored from trash'
    })

  } catch (error) {
    console.error('Event restoration failed:', error)
    return NextResponse.json({ error: 'Failed to restore event' }, { status: 500 })
  }
}