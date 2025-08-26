import { notFound } from 'next/navigation'
import { getCachedEventData } from "@/lib/gallery-cache"
import { GalleryThemeProvider } from "@/components/gallery-theme-provider"
import "@/styles/gallery-themes.css"

interface GalleryLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function GalleryLayout({ children, params }: GalleryLayoutProps) {
  const { slug } = await params
  
  // Get event data for theme - this is cached and doesn't require auth
  const eventWithAlbums = await getCachedEventData(slug, false)
  
  if (!eventWithAlbums) {
    notFound()
  }

  const themeId = eventWithAlbums.themeId || 'default'
  
  // Gallery layout is statically generated - no session checks here
  // All auth logic is handled client-side in GalleryLayoutHeader and GalleryAuthWrapper
  // This ensures the page remains cacheable and fast for all users

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
          {children}
        </div>
      </GalleryThemeProvider>
    </>
  )
}