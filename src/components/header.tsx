"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { authClient } from "@/lib/auth-client"

import { Button } from "./ui/button"
import { UserButton } from "@daveyplate/better-auth-ui"
import { ModeToggle } from "./mode-toggle"

interface HeaderProps {
    galleryTheme?: string
    eventSlug?: string
    showOnboardingSetup?: boolean
    onboardingStep?: number
}

export function Header({ galleryTheme, eventSlug, showOnboardingSetup = false, onboardingStep = 1 }: HeaderProps) {
    const pathname = usePathname()
    const { data: session, isPending } = authClient.useSession()

    // Check if we're on any gallery page
    const isGalleryPage = pathname?.startsWith('/gallery/')
    const isOnboardingPage = pathname?.startsWith('/onboarding')
    const isUploadPage = pathname?.includes('/upload')
    const isVoicePage = pathname?.includes('/voice')
    
    // Extract gallery slug from any gallery path
    const gallerySlug = pathname?.match(/\/gallery\/([^\/]+)/)?.[1]

    // Determine header classes based on gallery theme
    const getHeaderClasses = () => {
        if (!isGalleryPage || !galleryTheme) {
            return "sticky top-0 z-50 flex h-12 justify-between border-b bg-background px-4 md:h-14 md:px-6"
        }
        
        // Use gallery theme variables - these will be available from the gallery-app container
        return `sticky top-0 z-50 flex h-12 justify-between border-b border-border bg-card px-4 md:h-14 md:px-6`
    }

    const getTextClasses = () => {
        if (!isGalleryPage || !galleryTheme) {
            return "text-xl font-bold"
        }
        return "text-xl font-bold text-fg gallery-serif"
    }

    return (
        <header className={getHeaderClasses()}>
            <Link href="/" className="flex items-center" prefetch={false}>
                <span className={getTextClasses()}>Guest Snapper</span>
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
                ) : !isPending && session?.user ? (
                    <>
                        {isOnboardingPage && eventSlug ? (
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/gallery/${eventSlug}`} prefetch={false}>View Gallery</Link>
                            </Button>
                        ) : showOnboardingSetup && eventSlug ? (
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/onboarding?slug=${eventSlug}&step=${onboardingStep}`} prefetch={false}>Continue Setup</Link>
                            </Button>
                        ) : (
                            <Button asChild variant="outline" size="sm">
                                <Link href="/dashboard" prefetch={false}>Dashboard</Link>
                            </Button>
                        )}
                        <UserButton size="icon" />
                    </>
                ) : !isPending ? (
                    <>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/auth/sign-in" prefetch={false}>Login</Link>
                        </Button>
                        <Button asChild size="sm">
                            <Link href="/auth/sign-up" prefetch={false}>Create Account</Link>
                        </Button>
                    </>
                ) : (
                    // Loading state - show nothing to prevent flash
                    <div className="w-32 h-8" />
                )}
                
            </div>
        </header>
    )
}
