import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Playfair_Display, Noto_Sans_KR } from "next/font/google"
import type { ReactNode } from "react"
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import "@/styles/globals.css"

import { ConditionalHeader } from "@/components/conditional-header"
import { Providers } from "./providers"
import type { Locale } from "@/lib/dictionaries"

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

const notoSansKR = Noto_Sans_KR({
    variable: "--font-noto-sans-kr",
    subsets: ["latin"],
    weight: ["400", "500", "700"]
})

// Gallery theme fonts now loaded directly from Google Fonts (no edge requests)
// These are imported via CSS and only loaded when gallery components need them

export async function generateStaticParams() {
    return [{ lang: 'en' }, { lang: 'ko' }]
}

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.guestsnapper.com'

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: "Guest Snapper - QR Code Wedding Photo Sharing & Guest Album",
        template: "%s | Guest Snapper"
    },
    description:
        "Create a QR code wedding photo gallery in 60 seconds. Guests scan to upload unlimited photos & videos - no app required. Perfect for weddings, parties & events.",
    keywords: [
        "wedding photo sharing",
        "QR code photo gallery",
        "guest photo upload",
        "wedding QR code",
        "event photo sharing",
        "digital wedding album",
        "wedding photo app alternative",
        "guest photo contribution",
        "wedding memories"
    ],
    authors: [{ name: "Guest Snapper" }],
    creator: "Guest Snapper",
    publisher: "Guest Snapper",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    manifest: "/manifest.webmanifest",
    appleWebApp: {
        capable: true,
        title: "Guest Snapper",
        statusBarStyle: "default"
    },
    alternates: {
        canonical: "/"
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        url: siteUrl,
        title: "Guest Snapper - QR Code Wedding Photo Sharing",
        description: "Create a QR code wedding photo gallery in 60 seconds. Guests scan to upload unlimited photos & videos - no app required.",
        siteName: "Guest Snapper",
        images: [
            {
                url: "/og-image.jpg",
                width: 1200,
                height: 630,
                alt: "Guest Snapper - QR Code Wedding Photo Sharing"
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "Guest Snapper - QR Code Wedding Photo Sharing",
        description: "Create a QR code wedding photo gallery in 60 seconds. Guests scan to upload unlimited photos & videos - no app required.",
        images: ["/og-image.jpg"],
        creator: "@guestsnapper"
    },
    verification: {
        google: "google-site-verification-code", // Add your actual verification code
    }
}

export const viewport: Viewport = {
    initialScale: 1,
    viewportFit: "cover",
    width: "device-width"
}

export default async function RootLayout({
    children,
    params
}: Readonly<{
    children: ReactNode
    params: Promise<{ lang: Locale }>
}>) {
    const { lang } = await params
    return (
        <html lang={lang} suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${notoSansKR.variable} flex min-h-svh flex-col antialiased`}
            >
                <NuqsAdapter>
                    <Providers lang={lang}>
                        <ConditionalHeader />

                        {children}
                    </Providers>
                </NuqsAdapter>
            </body>
        </html>
    )
}
