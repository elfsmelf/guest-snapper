"use client"

import { usePathname } from "next/navigation"
import { Header } from "./header"

export function ConditionalHeader() {
    const pathname = usePathname()
    
    // Don't render header on gallery routes - gallery layout handles its own header
    if (pathname?.startsWith('/gallery/')) {
        return null
    }
    
    return <Header />
}