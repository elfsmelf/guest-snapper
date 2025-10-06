"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

import { Button } from "./ui/button"

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
            return "sticky top-0 z-50 border-b bg-background"
        }

        // Use gallery theme variables - these will be available from the gallery-app container
        return "sticky top-0 z-50 border-b border-border bg-card"
    }

    const getTextClasses = () => {
        if (!galleryTheme) {
            return "text-xl font-bold"
        }
        return "text-xl font-bold text-fg gallery-serif"
    }

    return (
        <header className={getHeaderClasses()}>
            <div className="container mx-auto flex h-16 justify-between items-center px-4 md:px-6 md:h-18">
                <Link href="/" className="flex items-center" prefetch={false}>
                    <Image
                        src="https://assets.guestsnapper.com/marketing/logos/Guest%20Snapper%20v6%20logo.png"
                        alt="Guest Snapper"
                        width={156}
                        height={42}
                        className="h-8 w-auto"
                    />
                </Link>

                <div className="flex items-center gap-2">
                    {(isUploadPage || isVoicePage) && gallerySlug ? (
                        <Button asChild variant="outline">
                            <Link href={`/gallery/${gallerySlug}`} prefetch={false}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Gallery
                            </Link>
                        </Button>
                    ) : showAuthButtons ? (
                        <Button asChild>
                            <Link href="/" prefetch={false}>Create QR Gallery</Link>
                        </Button>
                    ) : null}
                </div>
            </div>
        </header>
    )
}