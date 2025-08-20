"use client"

import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "next-themes"
import type { ReactNode } from "react"
import { Toaster } from "sonner"
import { authClient } from "@/lib/auth-client"

export function Providers({ children }: { children: ReactNode }) {
    const router = useRouter()

    return (
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
                social={{
                    providers: ["google"]
                }}
                organization={{
                    customRoles: [
                        { role: "collaborator", label: "Collaborator" },
                        { role: "photographer", label: "Photographer" }
                    ]
                }}
            >
                {children}

                <Toaster position="top-right" />
            </AuthUIProvider>
        </ThemeProvider>
    )
}
