import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { acceptInvitation, rejectInvitation, getInvitation } from "@/app/actions/invitation"

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
  
  // Get invitation details
  const invitation = await getInvitation(id)

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
              'You\'ve successfully joined the organization'
            ) : success === 'rejected' ? (
              'You\'ve declined the invitation'
            ) : error ? (
              'There was an error processing your invitation'
            ) : (
              'You have an organization invitation'
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!success && !error && invitation && (
            <>
              <div className="text-center space-y-2">
                <p className="font-medium">{invitation.organization?.name || 'Organization'}</p>
                <Badge variant="secondary" className="capitalize">
                  {invitation.role || 'Member'}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Role in the organization
                </p>
              </div>
              
              <form className="grid grid-cols-2 gap-3">
                <Button 
                  formAction={async () => {
                    'use server';
                    await acceptInvitation(id);
                  }}
                  className="w-full"
                >
                  Accept
                </Button>
                <Button 
                  formAction={async () => {
                    'use server';
                    await rejectInvitation(id);
                  }}
                  variant="outline" 
                  className="w-full"
                >
                  Decline
                </Button>
              </form>
            </>
          )}
          
          {!success && !error && !invitation && (
            <div className="text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                This invitation could not be found or has expired
              </p>
            </div>
          )}
          
          {(success || error) && (
            <div className="text-center space-y-2">
              {success === 'accepted' && (
                <p className="text-sm text-green-600">
                  You can now access the organization's events and collaborate with the team.
                </p>
              )}
              {error && (
                <p className="text-sm text-red-600">
                  {decodeURIComponent(error)}
                </p>
              )}
            </div>
          )}
          
          <Button asChild className="w-full">
            <Link href="/dashboard">
              Go to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}