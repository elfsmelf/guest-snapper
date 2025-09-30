import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/database/db'
import { events, uploads, users } from '@/database/schema'
import { eq, count, sql, desc, ilike, or } from 'drizzle-orm'

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

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '50', 10)
    const search = url.searchParams.get('search') || ''
    const offset = (page - 1) * limit

    // Build search conditions
    const searchConditions = search ? [
      ilike(events.name, `%${search}%`),
      ilike(events.coupleNames, `%${search}%`),
      ilike(events.slug, `%${search}%`),
      ilike(users.email, `%${search}%`),
      ilike(users.name, `%${search}%`)
    ] : []

    // Get events with user info, upload counts and file sizes
    const eventsQuery = db
      .select({
        // Event fields
        id: events.id,
        name: events.name,
        coupleNames: events.coupleNames,
        eventDate: events.eventDate,
        slug: events.slug,
        isPublished: events.isPublished,
        publishedAt: events.publishedAt,
        activationDate: events.activationDate,
        uploadWindowEnd: events.uploadWindowEnd,
        downloadWindowEnd: events.downloadWindowEnd,
        status: events.status,
        trashedAt: events.trashedAt,
        deleteAt: events.deleteAt,
        plan: events.plan,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        // User fields
        userId: events.userId,
        userEmail: users.email,
        userName: users.name,
        userImage: users.image,
        // Upload counts and sizes
        uploadCount: sql<number>`COUNT(DISTINCT ${uploads.id})`.as('uploadCount'),
        totalFileSize: sql<number>`COALESCE(SUM(${uploads.fileSize}), 0)`.as('totalFileSize'),
      })
      .from(events)
      .leftJoin(users, eq(events.userId, users.id))
      .leftJoin(uploads, eq(events.id, uploads.eventId))
      .where(searchConditions.length > 0 ? or(...searchConditions) : undefined)
      .groupBy(
        events.id,
        events.name,
        events.coupleNames,
        events.eventDate,
        events.slug,
        events.isPublished,
        events.publishedAt,
        events.activationDate,
        events.uploadWindowEnd,
        events.downloadWindowEnd,
        events.status,
        events.trashedAt,
        events.deleteAt,
        events.plan,
        events.createdAt,
        events.updatedAt,
        events.userId,
        users.email,
        users.name,
        users.image
      )
      .orderBy(desc(events.createdAt))
      .limit(limit)
      .offset(offset)

    const eventsResult = await eventsQuery

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(events)
      .leftJoin(users, eq(events.userId, users.id))
      .where(searchConditions.length > 0 ? or(...searchConditions) : undefined)

    const totalCount = totalCountResult[0]?.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Get status counts for dashboard stats
    const statusCounts = await db
      .select({
        status: events.status,
        count: count(),
      })
      .from(events)
      .groupBy(events.status)

    const stats = {
      total: totalCount,
      active: statusCounts.find(s => s.status === 'active')?.count || 0,
      trashed: statusCounts.find(s => s.status === 'trashed')?.count || 0,
      deleted: statusCounts.find(s => s.status === 'deleted')?.count || 0,
      published: eventsResult.filter(e => e.isPublished).length,
    }

    return NextResponse.json({
      events: eventsResult,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      stats,
    })

  } catch (error) {
    console.error('Admin events API error:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}