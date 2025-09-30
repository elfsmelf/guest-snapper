import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/database/db'
import { users } from '@/database/schema'
import { eq } from 'drizzle-orm'

/**
 * Temporary endpoint to set admin role for the current user
 * Only works if user's email is in ADMIN_EMAILS environment variable
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user's email is in ADMIN_EMAILS
    const adminEmailsEnv = process.env.ADMIN_EMAILS || 'support@guestsnapper.com'
    const adminEmails = adminEmailsEnv.split(',').map(email => email.trim())

    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({
        error: 'Your email is not in ADMIN_EMAILS environment variable',
        yourEmail: session.user.email,
        adminEmails: adminEmails
      }, { status: 403 })
    }

    // Update user role to admin
    await db.update(users)
      .set({ role: 'admin' })
      .where(eq(users.id, session.user.id))

    return NextResponse.json({
      success: true,
      message: `Admin role granted to ${session.user.email}`,
      userId: session.user.id
    })

  } catch (error) {
    console.error('Error setting admin role:', error)
    return NextResponse.json({
      error: 'Failed to set admin role',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}