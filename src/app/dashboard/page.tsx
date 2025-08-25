import Link from "next/link"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getUserAccessibleEvents } from "@/lib/auth-helpers"
import {
  Plus,
  Calendar,
  QrCode,
  Eye,
  ExternalLink,
  LinkIcon,
  Camera,
  ArrowRight,
  Clock,
  Rocket
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/copy-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { parseOnboardingState } from "@/types/onboarding"

function SectionTitle({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:mb-4 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  )
}

interface PageProps {
  searchParams: Promise<{ invitation?: string; orgName?: string; message?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  // Server-side authentication check
  const session = await auth.api.getSession({
    headers: await headers()
  })

  const user = session?.user

  if (!user) {
    return null // This should be handled by layout redirect
  }

  // Get search params for invitation status
  const params = await searchParams
  const invitationStatus = params.invitation
  const orgName = params.orgName
  const errorMessage = params.message

  // Fetch user events (both owned by user and from organizations they're members of)
  let userEvents: any[] = []

  try {
    userEvents = await getUserAccessibleEvents(user.id)
  } catch (error) {
    console.error('Error loading user events:', error)
  }

  return (
    <div className="space-y-6">
      {/* Invitation Status Messages */}
      {invitationStatus === 'accepted' && (
        <Alert className="border-border bg-muted">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">
            Successfully joined <strong>{orgName || 'the organization'}</strong>! You now have access to their events.
          </AlertDescription>
        </Alert>
      )}
      
      {invitationStatus === 'rejected' && (
        <Alert className="border-border bg-muted">
          <XCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">
            You declined the invitation to join <strong>{orgName || 'the organization'}</strong>.
          </AlertDescription>
        </Alert>
      )}
      
      {invitationStatus === 'error' && (
        <Alert className="border-border bg-muted">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-foreground">
            <strong>Error:</strong> {errorMessage || 'Failed to process invitation'}
          </AlertDescription>
        </Alert>
      )}
      
      {userEvents.length > 0 ? (
        <main className="mx-auto max-w-7xl">
          {/* Header */}
          <section className="mb-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Your Events
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your wedding galleries and events
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/dashboard/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Event
                </Link>
              </Button>
            </div>
          </section>

          {/* Resume Onboarding Section */}
          {(() => {
            const eventsWithIncompleteOnboarding = userEvents
              .map(event => ({
                ...event,
                onboardingState: parseOnboardingState(event.quickStartProgress)
              }))
              .filter(event => 
                event.onboardingState?.onboardingActive && 
                !event.onboardingState.onboardingComplete &&
                !event.onboardingState.onboardingSkipped
              )

            if (eventsWithIncompleteOnboarding.length === 0) return null

            return (
              <section className="mb-8">
                <SectionTitle 
                  title="Complete Your Setup"
                  description="Finish setting up these galleries to make them ready for guests"
                />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {eventsWithIncompleteOnboarding.map((event) => (
                    <Card key={event.id} className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Rocket className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">{event.name}</CardTitle>
                        </div>
                        <CardDescription>
                          Step {event.onboardingState?.currentStep || 1} of 10 • 
                          {event.onboardingState?.completedSteps.length || 0} steps completed
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="w-full bg-muted rounded-full h-2 mb-4">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${((event.onboardingState?.completedSteps.length || 0) / 10) * 100}%` 
                            }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Continue where you left off to get your gallery ready for guests.
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button asChild className="w-full">
                          <Link href={`/onboarding?slug=${event.slug}&step=${event.onboardingState?.currentStep || 1}`}>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Continue Setup
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </section>
            )
          })()}

          {/* Events Grid */}
          <section className="mb-8">
            <SectionTitle 
              title="Your Galleries"
              description="View and manage your completed events"
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userEvents.map((event) => {
                const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/gallery/${event.slug}`
                return (
                  <Card key={event.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden p-0">
                    {/* Cover Image */}
                    <div className="relative h-48 overflow-hidden m-0">
                      {event.coverImageUrl ? (
                        <img
                          src={event.coverImageUrl}
                          alt={`${event.coupleNames} - ${event.name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-rose-100 via-pink-50 to-rose-100 flex items-center justify-center">
                          <Camera className="h-12 w-12 text-rose-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20" />
                      
                      {/* Status Badges */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                        {/* Published Status */}
                        <div className={`px-2 py-1 rounded-full text-xs font-medium text-center ${
                          event.isPublished 
                            ? 'bg-muted text-muted-foreground border border-border' 
                            : 'bg-secondary text-secondary-foreground border border-border'
                        }`}>
                          {event.isPublished ? 'Published' : 'Private'}
                        </div>
                        
                        {/* Member Type */}
                        <div className={`px-2 py-1 rounded-full text-xs font-medium text-center ${
                          event.isOwner
                            ? 'bg-accent text-accent-foreground border border-border'
                            : 'bg-secondary text-secondary-foreground border border-border'
                        }`}>
                          {event.isOwner ? 'Owner' : 'Member'}
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <CardContent className="px-4 pt-3 pb-2">
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-semibold text-lg leading-tight">{event.coupleNames}</h3>
                          <p className="text-sm text-muted-foreground">
                            {event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : "Date not set"}
                          </p>
                        </div>

                        {/* Gallery URL */}
                        <div className="flex items-center gap-2">
                          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border bg-muted/30 px-2 py-1">
                            <LinkIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate text-xs text-muted-foreground">{eventUrl}</span>
                          </div>
                          <CopyButton text={eventUrl} variant="ghost" size="sm">
                            Copy
                          </CopyButton>
                        </div>
                      </div>
                    </CardContent>

                    {/* Action Buttons */}
                    <CardFooter className="px-4 pb-4 pt-1">
                      <div className="flex gap-2 w-full">
                        <Button asChild className="flex-1">
                          <Link href={`/dashboard/events/${event.id}`}>
                            Manage
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="default">
                          <Link href={`/gallery/${event.slug}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </section>
        </main>
      ) : (
        <Card className="py-12 text-center">
          <CardContent>
            <h3 className="mb-2 text-lg font-medium">No galleries yet</h3>
            <p className="mb-4 text-muted-foreground">
              Create your first wedding gallery to get started
            </p>
            <Button asChild>
              <Link href="/dashboard/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Gallery
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}