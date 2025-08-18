import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/database/db'
import { uploads } from '@/database/schema'
import { eq } from 'drizzle-orm'
import { canUserAccessEvent } from '@/lib/auth-helpers'
import { revalidateTag } from 'next/cache'

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

    const { id: uploadId } = await params

    // Get the upload and verify it exists
    const uploadResult = await db
      .select({
        id: uploads.id,
        eventId: uploads.eventId,
        isApproved: uploads.isApproved
      })
      .from(uploads)
      .where(eq(uploads.id, uploadId))
      .limit(1)

    if (!uploadResult.length) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    const upload = uploadResult[0]

    // Verify the user can access this event (owner or organization member)
    const hasAccess = await canUserAccessEvent(upload.eventId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Not authorized to reject uploads for this event' }, { status: 403 })
    }

    // Delete the rejected upload (or you could just mark it as rejected)
    const deletedUpload = await db
      .delete(uploads)
      .where(eq(uploads.id, uploadId))
      .returning()

    // Invalidate cache tags
    revalidateTag('gallery')
    revalidateTag('event')

    return NextResponse.json({
      success: true,
      upload: deletedUpload[0]
    })

  } catch (error) {
    console.error('Upload rejection failed:', error)
    return NextResponse.json({ error: 'Failed to reject upload' }, { status: 500 })
  }
}