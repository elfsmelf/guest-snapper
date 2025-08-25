import { notFound } from 'next/navigation'
import { getSession } from "@/lib/auth-session-helpers"
import { getCachedEventData } from "@/lib/gallery-cache"
import { parseOnboardingState } from "@/types/onboarding"
import { GalleryThemeProvider } from "@/components/gallery-theme-provider"
import { Header } from "@/components/header"
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
  
  // Check if current user is the owner and get onboarding state
  const session = await getSession() // Use optimized caching
  const isOwner = session?.user?.id === eventWithAlbums.userId
  const onboardingState = parseOnboardingState(eventWithAlbums.quickStartProgress)

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
          <Header 
            galleryTheme={themeId} 
            eventSlug={slug}
            showOnboardingSetup={isOwner && onboardingState?.onboardingActive && !onboardingState?.onboardingComplete && !onboardingState?.onboardingSkipped}
            onboardingStep={onboardingState?.currentStep}
          />
          {children}
        </div>
      </GalleryThemeProvider>
    </>
  )
}