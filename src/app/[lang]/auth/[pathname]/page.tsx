import { AuthCard } from "@daveyplate/better-auth-ui"
import { authViewPaths } from "@daveyplate/better-auth-ui/server"
import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getAuthDictionary, type Locale } from "@/lib/dictionaries"

export function generateStaticParams() {
    const pathnames = Object.values(authViewPaths).map((pathname) => ({ pathname }))
    const locales: Locale[] = ['en', 'ko']

    // Generate params for both locales
    return locales.flatMap(lang =>
        pathnames.map(({ pathname }) => ({ lang, pathname }))
    )
}

export default async function AuthPage({
    params,
    searchParams
}: {
    params: Promise<{ lang: Locale; pathname: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { lang, pathname } = await params
    const searchParamsData = await searchParams
    const dict = await getAuthDictionary(lang)

    // Check if user is already logged in
    const sessionData = await auth.api.getSession({
        headers: await headers()
    })

    // Redirect logged-in users to dashboard (except for settings page)
    if (sessionData?.user && pathname !== "settings") {
        redirect(`/${lang}/dashboard`)
    }

    // **EXAMPLE** SSR route protection for /auth/settings
    // NOTE: This opts /auth/settings out of static rendering
    // It already handles client side protection via useAuthenticate
    if (pathname === "settings") {
        if (!sessionData) redirect(`/${lang}/auth/sign-in?redirectTo=/${lang}/auth/settings`)
    }

    // Get redirectTo from search params, default to /dashboard
    const redirectTo = (searchParamsData.redirectTo as string) || `/${lang}/dashboard`

    // Keep original pathnames - no redirects

    return (
        <main className="container flex grow flex-col items-center justify-center gap-4 self-center p-4 md:p-6">
            <AuthCard
                pathname={pathname}
                redirectTo={redirectTo}
                localization={dict}
            />
        </main>
    )
}
