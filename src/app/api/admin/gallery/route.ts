import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/database/db'
import { uploads, events } from '@/database/schema'
import { desc, sql, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminEmails = (process.env.ADMIN_EMAILS || 'support@guestsnapper.com').split(',').map(email => email.trim())
    const isAdminByRole = (session.user as any).role === 'admin'
    const isAdminByEmail = adminEmails.includes(session.user.email)

    if (!isAdminByRole && !isAdminByEmail) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(uploads)

    const totalCount = Number(countResult.count)

    // Fetch uploads with event information
    const uploadsData = await db
      .select({
        id: uploads.id,
        eventId: uploads.eventId,
        fileName: uploads.fileName,
        fileUrl: uploads.fileUrl,
        fileType: uploads.fileType,
        mimeType: uploads.mimeType,
        fileSize: uploads.fileSize,
        caption: uploads.caption,
        isApproved: uploads.isApproved,
        uploaderName: uploads.uploaderName,
        thumbnailUrl: uploads.thumbnailUrl,
        width: uploads.width,
        height: uploads.height,
        createdAt: uploads.createdAt,
        eventName: events.name,
        eventSlug: events.slug,
      })
      .from(uploads)
      .leftJoin(events, eq(uploads.eventId, events.id))
      .orderBy(desc(uploads.createdAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      uploads: uploadsData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: offset + limit < totalCount,
        hasPreviousPage: page > 1,
      },
    })
  } catch (error) {
    console.error('Admin gallery fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gallery' },
      { status: 500 }
    )
  }
}
