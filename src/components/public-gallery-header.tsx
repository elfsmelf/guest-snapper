"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

import { Button } from "./ui/button"
import { ModeToggle } from "./mode-toggle"

interface PublicGalleryHeaderProps {
    galleryTheme?: string
    eventSlug?: string
    showAuthButtons?: boolean
}

/**
 * Optimized header for public gallery viewers that makes NO auth API calls.
 * This prevents unnecessary session requests for anonymous users.
 */
export function PublicGalleryHeader({ galleryTheme, eventSlug, showAuthButtons = false }: PublicGalleryHeaderProps) {
    const pathname = usePathname()
    
    // Check if we're on upload/voice pages (these need back button)
    const isUploadPage = pathname?.includes('/upload')
    const isVoicePage = pathname?.includes('/voice')
    const gallerySlug = pathname?.match(/\/gallery\/([^\/]+)/)?.[1]

    // Determine header classes based on gallery theme
    const getHeaderClasses = () => {
        if (!galleryTheme) {
            return "sticky top-0 z-50 flex h-12 justify-between border-b bg-background px-4 md:h-14 md:px-6"
        }
        
        // Use gallery theme variables - these will be available from the gallery-app container
        return `sticky top-0 z-50 flex h-12 justify-between border-b border-border bg-card px-4 md:h-14 md:px-6`
    }

    const getTextClasses = () => {
        if (!galleryTheme) {
            return "text-xl font-bold"
        }
        return "text-xl font-bold text-fg gallery-serif"
    }

    return (
        <header className={getHeaderClasses()}>
            <Link href="/" className="flex items-center" prefetch={false}>
                <Image
                    src="https://assets.guestsnapper.com/marketing/logos/Guest%20Snapper%20v6%20logo.png"
                    alt="Guest Snapper"
                    width={120}
                    height={32}
                    className="h-8 w-auto"
                />
            </Link>

            <div className="flex items-center gap-2">
                <ModeToggle />
                {(isUploadPage || isVoicePage) && gallerySlug ? (
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/gallery/${gallerySlug}`} prefetch={false}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Gallery
                        </Link>
                    </Button>
                ) : showAuthButtons ? (
                    <>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/auth/sign-in" prefetch={false}>Login</Link>
                        </Button>
                        <Button asChild size="sm">
                            <Link href="/auth/sign-up" prefetch={false}>Create Account</Link>
                        </Button>
                    </>
                ) : null}
            </div>
        </header>
    )
}