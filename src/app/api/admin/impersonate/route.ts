import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminEmails = (process.env.ADMIN_EMAILS || 'support@guestsnapper.com').split(',').map(email => email.trim())
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Prevent admin from impersonating themselves
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot impersonate yourself' }, { status: 400 })
    }

    // Use Better Auth's admin plugin to impersonate user via the correct API method
    const result = await (auth.api as any).adminImpersonateUser({
      headers: await headers(),
      body: { userId }
    })

    if (result?.error) {
      return NextResponse.json({ error: result.error.message || 'Failed to impersonate user' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Impersonation started successfully' })

  } catch (error: any) {
    console.error('Error impersonating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}