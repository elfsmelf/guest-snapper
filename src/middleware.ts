import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse } from "next/server"
import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'

// Internationalization configuration
const locales = ['en', 'ko']
const defaultLocale = 'en'

function getLocale(request: NextRequest): string {
  // Get the accept-language header
  const acceptLanguage = request.headers.get('accept-language') || ''

  // Use Negotiator to parse the accept-language header
  const headers = { 'accept-language': acceptLanguage }
  const languages = new Negotiator({ headers }).languages()

  // Match against supported locales
  try {
    return match(languages, locales, defaultLocale)
  } catch (error) {
    return defaultLocale
  }
}

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

    const { pathname } = request.nextUrl

    // Check if pathname already has a locale
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    // If no locale in pathname, redirect to locale-prefixed URL
    if (!pathnameHasLocale) {
        const locale = getLocale(request)
        request.nextUrl.pathname = `/${locale}${pathname}`
        return NextResponse.redirect(request.nextUrl)
    }

    // Public routes that don't require authentication
    const publicRoutes = [
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

    // Check if route is public (account for locale prefix)
    const isPublicRoute = publicRoutes.some(route => {
        // Check with locale prefix
        return locales.some(locale =>
            pathname.startsWith(`/${locale}${route}`) || pathname === `/${locale}`
        )
    })
    
    // Admin routes require special handling (check with locale prefix)
    const isAdminRoute = locales.some(locale => pathname.startsWith(`/${locale}/admin`))
    
    if (isPublicRoute) {
        return NextResponse.next()
    }

    // Check cookie for optimistic redirects for protected routes
    // Use getSession in your RSC to protect a route via SSR or useAuthenticate client side
    const sessionCookie = getSessionCookie(request)

    if (!sessionCookie) {
        // Extract locale from pathname
        const locale = locales.find(loc => pathname.startsWith(`/${loc}/`)) || defaultLocale
        const redirectTo = pathname + request.nextUrl.search

        // Redirect to sign-in with the original destination (maintain locale)
        return NextResponse.redirect(
            new URL(`/${locale}/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`, request.url)
        )
    }

    return NextResponse.next()
}

export const config = {
    // Match all routes except static files and API routes
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         * - API routes that handle their own auth
         * - PostHog ingest endpoints
         * - og-image files
         */
        '/((?!_next/static|_next/image|favicon.ico|og-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/|ingest/).*)',
    ]
}
