import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ action?: string; success?: string; error?: string }>
}

export default async function AcceptInvitationPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { action, success, error } = await searchParams

  // Get current session
  const session = await auth.api.getSession({
    headers: await headers()
  })

  // Get invitation details (only if user is authenticated)
  let invitation = null
  let invitationError = null
  
  if (session?.user) {
    try {
      console.log('Fetching invitation with ID:', id)
      invitation = await auth.api.getInvitation({
        headers: await headers(),
        query: { id }
      })
      console.log('Invitation fetched:', invitation)
    } catch (err: any) {
      console.error('Error fetching invitation:', err)
      invitationError = err.message || 'Failed to fetch invitation'
      
      // If it's a "not recipient" error, we can still show the page but with appropriate messaging
      if (err.message?.includes('not the recipient')) {
        // We'll handle this case in the UI
      } else if (err.message?.includes('not found') || err.message?.includes('expired')) {
        notFound()
      }
    }
  }

  // Handle invitation error (wrong user)
  if (invitationError && invitationError.includes('not the recipient')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle>Wrong Account</CardTitle>
            <CardDescription>
              You're signed in as <strong>{session?.user?.email}</strong>, but this invitation is for a different email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Please sign out and sign in with the email address that received this invitation.
              </p>
              <div className="space-y-2">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/sign-out">
                    Sign Out & Try Again
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="w-full">
                  <Link href="/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If user is not logged in, redirect to sign in
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>Organization Invitation</CardTitle>
            <CardDescription>
              Please sign in to view this invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Sign in with the email address that received the invitation
              </p>
            </div>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/auth/sign-in?redirectTo=${encodeURIComponent(`/accept-invitation/${id}`)}`}>
                  Sign In
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href={`/auth/sign-up?redirectTo=${encodeURIComponent(`/accept-invitation/${id}`)}`}>
                  Create Account
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Handle invitation acceptance
  if (action === 'accept') {
    try {
      console.log('Attempting to accept invitation:', id)
      const result = await auth.api.acceptInvitation({
        headers: await headers(),
        body: { invitationId: id }
      })
      console.log('Invitation accepted successfully:', result)
      redirect(`/dashboard?invitation=accepted&orgName=${encodeURIComponent(invitation?.organizationName || 'organization')}`)
    } catch (err: any) {
      // Handle redirect errors - simplified for build
      
      console.error('Failed to accept invitation:', err)
      // Redirect with more specific error information
      const errorMessage = err?.message || 'Failed to accept invitation'
      redirect(`/dashboard?invitation=error&message=${encodeURIComponent(errorMessage)}`)
    }
  }

  // Handle invitation rejection
  if (action === 'reject') {
    try {
      console.log('Attempting to reject invitation:', id)
      const result = await auth.api.rejectInvitation({
        headers: await headers(),
        body: { invitationId: id }
      })
      console.log('Invitation rejected successfully:', result)
      redirect(`/dashboard?invitation=rejected&orgName=${encodeURIComponent(invitation?.organizationName || 'organization')}`)
    } catch (err: any) {
      // Handle redirect errors - simplified for build
      
      console.error('Failed to reject invitation:', err)
      // Redirect with more specific error information
      const errorMessage = err?.message || 'Failed to reject invitation'
      redirect(`/dashboard?invitation=error&message=${encodeURIComponent(errorMessage)}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            {success === 'accepted' ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : success === 'rejected' ? (
              <XCircle className="w-6 h-6 text-red-600" />
            ) : error ? (
              <AlertCircle className="w-6 h-6 text-red-600" />
            ) : (
              <Users className="w-6 h-6 text-blue-600" />
            )}
          </div>
          
          <CardTitle>
            {success === 'accepted' ? 'Invitation Accepted!' :
             success === 'rejected' ? 'Invitation Declined' :
             error ? 'Something went wrong' :
             'Organization Invitation'}
          </CardTitle>
          
          <CardDescription>
            {success === 'accepted' ? (
              <>You've successfully joined <strong>{invitation?.organizationName}</strong></>
            ) : success === 'rejected' ? (
              <>You've declined the invitation to join <strong>{invitation?.organizationName}</strong></>
            ) : error ? (
              'There was an error processing your invitation'
            ) : invitation ? (
              <>You've been invited to join <strong>{invitation?.organizationName}</strong></>
            ) : (
              'You have an organization invitation'
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!success && !error && invitation && (
            <>
              <div className="text-center space-y-2">
                <Badge variant="secondary">{invitation.role}</Badge>
                <p className="text-sm text-muted-foreground">
                  Role in the organization
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <form action={`/accept-invitation/${id}`} method="GET">
                  <input type="hidden" name="action" value="accept" />
                  <Button type="submit" className="w-full">
                    Accept
                  </Button>
                </form>
                
                <form action={`/accept-invitation/${id}`} method="GET">
                  <input type="hidden" name="action" value="reject" />
                  <Button type="submit" variant="outline" className="w-full">
                    Decline
                  </Button>
                </form>
              </div>
            </>
          )}
          
          {(success || error) && (
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}