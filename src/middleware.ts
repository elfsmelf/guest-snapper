import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
    // Handle www redirect first
    if (request.nextUrl.hostname === 'guestsnapper.com') {
        return NextResponse.redirect(
            new URL(`https://www.guestsnapper.com${request.nextUrl.pathname}${request.nextUrl.search}`, request.url)
        )
    }

    // Public routes that don't require authentication
    const publicRoutes = ['/gallery', '/auth/sign-in', '/auth/sign-up', '/auth/accept-invitation', '/api/accept-invitation']
    const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))
    
    // Admin routes require special handling
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
    
    if (isPublicRoute) {
        return NextResponse.next()
    }

    // Check cookie for optimistic redirects for protected routes
    // Use getSession in your RSC to protect a route via SSR or useAuthenticate client side
    const sessionCookie = getSessionCookie(request)

    if (!sessionCookie) {
        const redirectTo = request.nextUrl.pathname + request.nextUrl.search
        
        // Prevent redirect loops by not redirecting to auth pages
        if (request.nextUrl.pathname.startsWith('/auth/')) {
            return NextResponse.redirect(new URL('/auth/sign-in', request.url))
        }
        
        return NextResponse.redirect(
            new URL(`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`, request.url)
        )
    }

    return NextResponse.next()
}

export const config = {
    // Protected routes plus domain handling
    // Exclude static files and public assets
    matcher: [
        "/auth/settings",
        "/admin/:path*",
        "/((?!api|_next|favicon.ico|manifest.webmanifest|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp).*)"
    ]
}
