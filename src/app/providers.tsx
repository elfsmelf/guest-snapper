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
                        // With SSR, we want higher staleTime to avoid refetching immediately
                        staleTime: 1000 * 60 * 5, // 5 minutes
                        retry: 1,
                        refetchOnWindowFocus: false, // Prevent refetching on tab/window focus
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
                    onSessionChange={() => {
                        router.refresh()
                    }}
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
