"use client"

import { usePathname } from "next/navigation"
import { Header } from "./header"

export function ConditionalHeader() {
    const pathname = usePathname()

    // Don't render header on gallery routes - gallery layout handles its own header
    // Check for both /gallery/ and /[lang]/gallery/ patterns
    if (pathname?.includes('/gallery/')) {
        return null
    }

    return <Header />
}