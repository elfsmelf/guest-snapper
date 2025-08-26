import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
    // Block Vercel's automated requests to reduce edge function usage
    const userAgent = request.headers.get('user-agent') || ''
    if (userAgent.includes('vercel-favicon') || userAgent.includes('vercel-screenshot')) {
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
        const response = NextResponse.next()
        
        // Set cache headers for public gallery routes
        // This complements the static generation with ISR + on-demand revalidation
        if (request.nextUrl.pathname.startsWith('/gallery/')) {
            // Edge cache: 10 minutes with stale-while-revalidate for performance
            response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60')
            response.headers.set('CDN-Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60')
            // Browser cache: Immediate revalidation to respect on-demand invalidation
            response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
            // Allow bfcache but enable pageshow handler to refresh when needed
            response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
        }
        
        return response
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
    // Protected routes plus domain handling
    // Exclude static files, public assets, and public auth routes
    matcher: [
        "/auth/settings",
        "/admin/:path*",
        "/((?!api|_next|auth/sign-in|auth/sign-up|auth/email-otp|auth/forgot-password|auth/reset-password|auth/magic-link|auth/accept-invitation|favicon.ico|manifest.webmanifest|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp).*)"
    ]
}
