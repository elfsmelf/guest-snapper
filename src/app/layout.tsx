import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google"
import type { ReactNode } from "react"
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import "@/styles/globals.css"

import { ConditionalHeader } from "@/components/conditional-header"
import { Providers } from "./providers"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"]
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"]
})

const playfairDisplay = Playfair_Display({
    variable: "--font-playfair-display",
    subsets: ["latin"]
})

// Gallery theme fonts now loaded directly from Google Fonts (no edge requests)
// These are imported via CSS and only loaded when gallery components need them

export const metadata: Metadata = {
    title: "GuestSnapper - Wedding Photo Gallery",
    description:
        "Create beautiful wedding photo galleries that guests can easily access and contribute to. Share memories, collect photos, and preserve your special moments.",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
        capable: true,
        title: "GuestSnapper",
        statusBarStyle: "default"
    }
}

export const viewport: Viewport = {
    initialScale: 1,
    viewportFit: "cover",
    width: "device-width"
}

export default function RootLayout({
    children
}: Readonly<{
    children: ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} flex min-h-svh flex-col antialiased`}
            >
                <NuqsAdapter>
                    <Providers>
                        <ConditionalHeader />

                        {children}
                    </Providers>
                </NuqsAdapter>
            </body>
        </html>
    )
}
