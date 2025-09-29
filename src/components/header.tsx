"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import Image from "next/image"

import { Button } from "./ui/button"
import { UserButton } from "./user-button"
import { ModeToggle } from "./mode-toggle"
import { Skeleton } from "./ui/skeleton"

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
            return "sticky top-0 z-50 border-b bg-white"
        }

        // Use gallery theme variables - these will be available from the gallery-app container
        return `sticky top-0 z-50 border-b border-border bg-card`
    }

    const getTextClasses = () => {
        if (!isGalleryPage || !galleryTheme) {
            return "text-xl font-bold"
        }
        return "text-xl font-bold text-fg gallery-serif"
    }

    return (
        <header className={getHeaderClasses()}>
            <div className="container mx-auto flex h-16 justify-between items-center px-6 md:h-18">
                <Link href="/" className="flex items-center" prefetch={false}>
                    <Image
                        src="https://assets.guestsnapper.com/marketing/logos/Guest%20Snapper%20v6%20logo.png"
                        alt="Guest Snapper"
                        width={156}
                        height={42}
                        className="h-10 w-auto"
                    />
                </Link>

                <div className="flex items-center gap-2">
                <ModeToggle />
                {(isUploadPage || isVoicePage) && gallerySlug ? (
                    <Button asChild variant="outline">
                        <Link href={`/gallery/${gallerySlug}`} prefetch={false}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Gallery
                        </Link>
                    </Button>
                ) : !isPending && session?.user ? (
                    <>
                        {isOnboardingPage && eventSlug ? (
                            <Button asChild variant="outline">
                                <Link href={`/gallery/${eventSlug}`} prefetch={false}>View Gallery</Link>
                            </Button>
                        ) : showOnboardingSetup && eventSlug ? (
                            <Button asChild variant="outline">
                                <Link href={`/onboarding?slug=${eventSlug}&step=${onboardingStep}`} prefetch={false}>Continue Setup</Link>
                            </Button>
                        ) : (
                            <Button asChild variant="outline">
                                <Link href="/dashboard" prefetch={false}>Dashboard</Link>
                            </Button>
                        )}
                        <UserButton size="icon" user={session.user} />
                    </>
                ) : !isPending ? (
                    <>
                        <Button asChild variant="outline">
                            <Link href="/auth/sign-in" prefetch={false}>Login</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/auth/sign-up" prefetch={false}>Create Account</Link>
                        </Button>
                    </>
                ) : (
                    // Loading state - show skeleton buttons
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-28" />
                    </div>
                )}

                </div>
            </div>
        </header>
    )
}
