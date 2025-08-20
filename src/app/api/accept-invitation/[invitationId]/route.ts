import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const { invitationId } = await params
    
    // Check if user is authenticated
    const session = await auth.api.getSession({
      headers: await headers()
    })

    // If not authenticated, redirect to sign-in with callback to return here
    if (!session?.user) {
      const currentUrl = request.url
      const signInUrl = new URL('/auth/sign-in', request.url)
      signInUrl.searchParams.set('redirectTo', currentUrl)
      return NextResponse.redirect(signInUrl)
    }

    // User is authenticated, proceed with invitation acceptance
    console.log('Accepting invitation:', invitationId)
    
    try {
      // Accept the invitation using Better Auth server API
      const result = await (auth.api as any).acceptInvitation({
        headers: await headers(),
        body: {
          invitationId
        }
      })

      console.log('Invitation acceptance result:', result)

      if (result?.error) {
        console.error('Error accepting invitation:', result.error)
        // Redirect to home with error
        const errorUrl = new URL('/', request.url)
        errorUrl.searchParams.set('error', 'invitation-failed')
        return NextResponse.redirect(errorUrl)
      }

      // Success! Redirect to dashboard
      console.log('Invitation accepted successfully, redirecting to dashboard')
      const dashboardUrl = new URL('/dashboard', request.url)
      dashboardUrl.searchParams.set('invited', 'true') // Optional success indicator
      return NextResponse.redirect(dashboardUrl)

    } catch (acceptError: any) {
      console.error('Failed to accept invitation:', acceptError)
      
      // Handle specific error cases
      if (acceptError.message?.includes('already accepted') || acceptError.message?.includes('expired')) {
        const errorUrl = new URL('/dashboard', request.url)
        errorUrl.searchParams.set('message', 'invitation-already-processed')
        return NextResponse.redirect(errorUrl)
      }

      // Generic error
      const errorUrl = new URL('/', request.url)
      errorUrl.searchParams.set('error', 'invitation-error')
      return NextResponse.redirect(errorUrl)
    }

  } catch (error: any) {
    console.error('Error in accept invitation route:', error)
    
    // Fallback error redirect
    const errorUrl = new URL('/', request.url)
    errorUrl.searchParams.set('error', 'unexpected-error')
    return NextResponse.redirect(errorUrl)
  }
}