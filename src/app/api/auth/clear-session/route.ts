import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Parse request to get specific user email for targeted clearing
    const body = await request.json().catch(() => ({}))
    const { userEmail } = body

    // Check if the current admin session should be preserved
    const session = await auth.api.getSession({
      headers: request.headers
    })

    const response = NextResponse.json({ 
      success: true, 
      message: `Cleared auth state for ${userEmail || 'user'}` 
    })

    // Only clear temporary auth state cookies, not the main session token
    const tempCookiesToClear = [
      'better-auth.pk_challenge',
      'better-auth.state', 
      'better-auth.code_verifier',
    ]

    // If the deleted user email matches current session, clear everything
    // Otherwise only clear temporary state
    if (!session?.user || session.user.email === userEmail) {
      tempCookiesToClear.push(
        'better-auth.session_token',
        'better-auth.csrf_token'
      )
      console.log(`🔄 Clearing all cookies for deleted user session: ${userEmail}`)
    } else {
      console.log(`🔒 Preserving admin session for: ${session.user.email}, only clearing temp cookies`)
    }

    // Clear specified cookies
    tempCookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    })

    return response
  } catch (error: any) {
    console.error('Cookie clear error:', error)
    return NextResponse.json({ 
      error: 'Failed to clear auth state',
      details: error.message 
    }, { status: 500 })
  }
}