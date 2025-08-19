import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/database/db'
import { uploads, events } from '@/database/schema'
import { eq, and, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { canUserAccessEvent } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    // Get current session (allow both authenticated and anonymous users)
    const session = await auth.api.getSession({
      headers: await headers()
    })

    const eventId = (await params).eventId

    // Check if user has access to this event
    let hasAccess = false
    if (session?.user && true) {
      hasAccess = await canUserAccessEvent(eventId, session.user.id)
    } else if ((session?.user as any)?.isAnonymous) {
      // For anonymous users, they can access if they have a session for this event
      hasAccess = true // Simplified for now - you might want more strict checking
    }

    // Fetch uploads based on access level
    const uploadsResult = await db
      .select({
        id: uploads.id,
        eventId: uploads.eventId,
        fileName: uploads.fileName,
        fileUrl: uploads.fileUrl,
        fileType: uploads.fileType,
        uploaderName: uploads.uploaderName,
        caption: uploads.caption,
        isApproved: uploads.isApproved,
        createdAt: uploads.createdAt,
        albumId: uploads.albumId,
      })
      .from(uploads)
      .where(
        hasAccess 
          ? eq(uploads.eventId, eventId)
          : and(eq(uploads.eventId, eventId), eq(uploads.isApproved, true))
      )
      .orderBy(desc(uploads.createdAt))

    // Separate into approved and pending
    const approvedUploads = uploadsResult.filter(u => u.isApproved)
    const pendingUploads = hasAccess ? uploadsResult.filter(u => !u.isApproved) : []

    return NextResponse.json({
      uploads: approvedUploads,
      pendingUploads,
      approvedCount: approvedUploads.length,
      pendingCount: pendingUploads.length,
      totalCount: uploadsResult.length,
      hasAccess,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    })

  } catch (error) {
    console.error('Failed to get gallery data:', error)
    return NextResponse.json(
      { error: 'Failed to get gallery data' },
      { status: 500 }
    )
  }
}