import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
    // Block Vercel's automated requests and other bots to reduce edge function usage
    const userAgent = request.headers.get('user-agent') || ''
    if (userAgent.includes('vercel-favicon') || 
        userAgent.includes('vercel-screenshot') ||
        userAgent.includes('vercel-bot') ||
        userAgent.includes('bot') && userAgent.includes('vercel')) {
        return new NextResponse('Blocked', { status: 403 })
    }

    // Handle www redirect first
    if (request.nextUrl.hostname === 'guestsnapper.com') {
        return NextResponse.redirect(
            new URL(`https://www.guestsnapper.com${request.nextUrl.pathname}${request.nextUrl.search}`, request.url)
        )
    }

    // Public routes that don't require authentication
    const publicRoutes = [
        '/', 
        '/gallery', 
        '/auth/sign-in', 
        '/auth/sign-up', 
        '/auth/email-otp',
        '/auth/forgot-password',
        '/auth/reset-password', 
        '/auth/magic-link',
        '/auth/accept-invitation', 
        '/api/accept-invitation'
    ]
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
        
        // Redirect to sign-in with the original destination
        return NextResponse.redirect(
            new URL(`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`, request.url)
        )
    }

    return NextResponse.next()
}

export const config = {
    // Only match routes that absolutely need server-side middleware protection
    // Gallery routes removed - handle view persistence and auth client-side for better performance
    matcher: [
        "/dashboard/:path*",     // Protected dashboard routes
        "/admin/:path*",         // Admin routes  
        "/auth/settings",        // Settings page
        "/onboarding/:path*",    // Onboarding flow
        "/events/:path*",        // Event management (if exists)
        "/checkout/:path*"       // Payment flows
    ]
}
