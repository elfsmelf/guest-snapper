"use client"

import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "next-themes"
import type { ReactNode } from "react"
import { Toaster } from "@/components/ui/sonner"
import { authClient } from "@/lib/auth-client"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
// Note: Better Auth session management is handled directly via authClient.useSession()

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

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <AuthUIProvider
                    authClient={authClient as any}
                    navigate={router.push}
                    replace={router.replace}
                    Link={Link}
                    emailOTP={true}
                    credentials={false}
                    signUp={true}
                    social={{
                        providers: ["google"]
                    }}
                >
                    {children}

                    <Toaster position="top-right" />
                </AuthUIProvider>
            </ThemeProvider>
        </QueryClientProvider>
    )
}
