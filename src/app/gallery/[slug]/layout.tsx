import { notFound } from 'next/navigation'
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getCachedEventData } from "@/lib/gallery-cache"
import { parseOnboardingState } from "@/types/onboarding"
import { GalleryThemeProvider } from "@/components/gallery-theme-provider"
import { Header } from "@/components/header"
import { PublicGalleryHeader } from "@/components/public-gallery-header"
import "@/styles/gallery-themes.css"

interface GalleryLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function GalleryLayout({ children, params }: GalleryLayoutProps) {
  const { slug } = await params
  
  // Get event data to fetch the theme
  const eventWithAlbums = await getCachedEventData(slug, false)
  
  if (!eventWithAlbums) {
    notFound()
  }

  const themeId = eventWithAlbums.themeId || 'default'
  
  // Only fetch session if we need to check ownership - avoids API calls for public viewers
  // This dramatically reduces auth requests for anonymous gallery visitors
  let session = null
  let isOwner = false
  let onboardingState = null
  
  // Check if session cookie exists before making API call
  const headersList = await headers()
  const sessionCookie = headersList.get('cookie')?.includes('better-auth.session_token')
  
  if (sessionCookie) {
    // Only make session API call if session cookie exists
    session = await auth.api.getSession({ headers: headersList })
    isOwner = session?.user?.id === eventWithAlbums.userId
    
    if (isOwner) {
      onboardingState = parseOnboardingState(eventWithAlbums.quickStartProgress)
    }
  }

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // Immediately apply gallery theme to prevent flash
              const themeId = '${themeId}';
              const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              const galleryMode = isDark ? 'dark' : 'light';
              
              document.documentElement.setAttribute('data-gallery-theme', themeId);
              document.documentElement.setAttribute('data-gallery-mode', galleryMode);
              document.documentElement.classList.add('gallery-theme-' + themeId);
            })();
          `
        }}
      />
      <GalleryThemeProvider themeId={themeId}>
        <div className="gallery-app">
          {session?.user ? (
            // Authenticated user - use full header with session management
            <Header 
              galleryTheme={themeId} 
              eventSlug={slug}
              showOnboardingSetup={isOwner && onboardingState?.onboardingActive && !onboardingState?.onboardingComplete && !onboardingState?.onboardingSkipped}
              onboardingStep={onboardingState?.currentStep}
            />
          ) : (
            // Anonymous user - use public header with NO session API calls
            <PublicGalleryHeader 
              galleryTheme={themeId} 
              eventSlug={slug}
              showAuthButtons={true}
            />
          )}
          {children}
        </div>
      </GalleryThemeProvider>
    </>
  )
}