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
        
        // Handle guest tracking for public gallery routes
        if (request.nextUrl.pathname.startsWith('/gallery/')) {
            const sessionCookie = getSessionCookie(request)
            
            // If no authenticated session, handle guest tracking
            if (!sessionCookie) {
                const existingGuestId = request.cookies.get('guest_id')?.value
                
                // If no guest_id cookie exists, create one
                if (!existingGuestId) {
                    const guestId = crypto.randomUUID()
                    response.cookies.set('guest_id', guestId, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 60 * 60 * 24 * 30 // 30 days
                    })
                }
            }
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
