import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Lora, Playfair_Display, Libre_Baskerville, Architects_Daughter, Inter, Source_Serif_4 } from "next/font/google"
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

// Gallery fonts for themes
const lora = Lora({
    variable: "--font-lora",
    subsets: ["latin"],
    weight: ["400", "700"],
    style: ["normal"],
    display: "swap"
})

const playfairDisplay = Playfair_Display({
    variable: "--font-playfair-display",
    subsets: ["latin"],
    weight: ["400", "700"],
    style: ["normal"],
    display: "swap"
})

const libreBaskerville = Libre_Baskerville({
    variable: "--font-libre-baskerville",
    subsets: ["latin"],
    weight: ["400", "700"],
    style: ["normal"],
    display: "swap"
})

const architectsDaughter = Architects_Daughter({
    variable: "--font-architects-daughter",
    subsets: ["latin"],
    weight: ["400"],
    display: "swap"
})

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    weight: ["400", "600"],
    display: "swap"
})

const sourceSerif4 = Source_Serif_4({
    variable: "--font-source-serif-4",
    subsets: ["latin"],
    weight: ["400", "700"],
    style: ["normal"],
    display: "swap"
})

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
                className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} ${playfairDisplay.variable} ${libreBaskerville.variable} ${architectsDaughter.variable} ${inter.variable} ${sourceSerif4.variable} flex min-h-svh flex-col antialiased`}
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
