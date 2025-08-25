import { notFound, redirect } from 'next/navigation'
import { getSession } from "@/lib/auth-session-helpers"
import { getCachedEventData } from "@/lib/gallery-cache"
import { canUserAccessEvent } from "@/lib/auth-helpers"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"

interface OnboardingPageProps {
  searchParams: Promise<{ 
    eventId?: string
    slug?: string
  }>
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const searchParamsData = await searchParams
  const { eventId, slug } = searchParamsData
  
  // Must have either eventId or slug
  if (!eventId && !slug) {
    redirect('/dashboard')
  }

  // Check if current user has access
  const session = await getSession() // Use optimized caching

  if (!session?.user) {
    const redirectTo = slug ? `/onboarding?slug=${slug}` : '/onboarding'
    redirect(`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`)
  }

  // Get event data
  let eventWithAlbums
  if (slug) {
    eventWithAlbums = await getCachedEventData(slug, false)
  } else if (eventId) {
    // If we only have eventId, we need to get the event differently
    // For now, redirect to dashboard if no slug provided
    redirect('/dashboard')
  }
  
  if (!eventWithAlbums) {
    notFound()
  }

  // Check if user is owner or has access
  const isOwner = session.user.id === eventWithAlbums.userId
  const hasEventAccess = await canUserAccessEvent(eventWithAlbums.id, session.user.id)

  if (!isOwner && !hasEventAccess) {
    redirect('/dashboard')
  }

  // Pass event data directly as props - no server-side prefetching

  return (
    <div className="container mx-auto px-4 py-8">
      <OnboardingWizard
        eventId={eventWithAlbums.id}
        eventSlug={eventWithAlbums.slug}
        eventName={eventWithAlbums.name}
      />
    </div>
  )
}