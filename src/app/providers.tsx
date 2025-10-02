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
import posthog from 'posthog-js'
// Note: Better Auth session management is handled directly via authClient.useSession()

const authTexts = {
  SIGN_IN: "Welcome to Guest Snapper",
  SIGN_IN_DESCRIPTION: "Create your wedding photo gallery or access your existing one. Choose Google or enter your email to continue.",
  SIGN_UP: "Welcome to Guest Snapper",
  SIGN_UP_DESCRIPTION: "Create your wedding photo gallery or access your existing one. Choose Google or enter your email to continue.",
  EMAIL_PLACEHOLDER: "Enter your email address",
  MAGIC_LINK: "Continue with email",
  MAGIC_LINK_DESCRIPTION: "Enter your email to continue",
  MAGIC_LINK_ACTION: "Continue",
  EMAIL_OTP: "Continue with email",
  EMAIL_OTP_DESCRIPTION: "Enter your email to continue",
  EMAIL_OTP_SEND_ACTION: "Send verification code",
  EMAIL_OTP_VERIFY_ACTION: "Verify and continue",
  OR_CONTINUE_WITH: "Or continue with",
  SIGN_IN_WITH: "Continue with",
  DONT_HAVE_AN_ACCOUNT: "New to Guest Snapper?",
  ALREADY_HAVE_AN_ACCOUNT: "Already have an account?",
  SIGN_IN_ACTION: "Continue",
  SIGN_UP_ACTION: "Continue",
  SIGN_IN_USERNAME_DESCRIPTION: "Enter your email to continue to your wedding gallery",
} as const

export function Providers({ children }: { children: ReactNode }) {
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

    // Track user authentication state with PostHog
    const { data: session } = authClient.useSession()

    useEffect(() => {
        if (session?.user) {
            // Identify user in PostHog when they sign in
            posthog.identify(session.user.id, {
                email: session.user.email,
                name: session.user.name,
            })
        } else {
            // Reset when user signs out
            posthog.reset()
        }
    }, [session])

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
                                url: "/settings" // Redirect to our custom settings page
                            }}
                            localization={authTexts}
                        >
                            {children}

                            <Toaster position="top-right" />
                        </AuthUIProvider>
                    </TooltipProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </PostHogProvider>
    )
}
