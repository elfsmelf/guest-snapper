"use client"

import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import type { AuthLocalization } from "@daveyplate/better-auth-ui"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "next-themes"
import type { ReactNode } from "react"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { authClient } from "@/lib/auth-client"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { PostHogProvider } from "@/components/posthog-provider"
import { PostHogSessionTracker } from "@/components/posthog-session-tracker"
import { FreshchatWrapper } from "@/components/freshchat-wrapper"
import type { Locale, AuthDictionary } from "@/lib/dictionaries"
// Note: Better Auth session management is handled directly via authClient.useSession()

export function Providers({ children, lang }: { children: ReactNode; lang: Locale }) {
    const [authTexts, setAuthTexts] = useState<AuthDictionary | null>(null)
    const router = useRouter()
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Reduced staleTime for more responsive updates (especially for event settings)
                        staleTime: 1000 * 30, // 30 seconds
                        retry: 1,
                        refetchOnWindowFocus: true, // Enable refetching on focus for fresh data
                        refetchOnReconnect: true, // Refetch when connection is restored
                        refetchOnMount: true, // Always fetch fresh data on mount
                    },
                },
            })
    )

    useEffect(() => {
        // Load auth dictionary based on locale
        async function loadAuthDictionary() {
            const dict = await import(`@/app/dictionaries/auth-${lang}.json`)
            setAuthTexts(dict.default)
        }
        loadAuthDictionary()
    }, [lang])

    // Don't render until auth texts are loaded
    if (!authTexts) {
        return null
    }

    return (
        <PostHogProvider>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                >
                    <TooltipProvider>
                        <AuthUIProvider
                            authClient={authClient as any}
                            navigate={router.push}
                            replace={router.replace}
                            onSessionChange={() => router.refresh()}
                            Link={Link}
                            emailOTP={true}
                            credentials={false}
                            signUp={true}
                            social={{
                                providers: ["google"]
                            }}
                            settings={{
                                url: `/${lang}/settings` // Redirect to our custom settings page with locale
                            }}
                            localization={authTexts}
                        >
                            <PostHogSessionTracker />
                            <FreshchatWrapper />
                            {children}

                            <Toaster position="top-right" />
                        </AuthUIProvider>
                    </TooltipProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </PostHogProvider>
    )
}
