import { AuthCard } from "@daveyplate/better-auth-ui"
import { authViewPaths } from "@daveyplate/better-auth-ui/server"
import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export function generateStaticParams() {
    return Object.values(authViewPaths).map((pathname) => ({ pathname }))
}

export default async function AuthPage({
    params,
    searchParams
}: {
    params: Promise<{ pathname: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { pathname } = await params
    const searchParamsData = await searchParams

    // **EXAMPLE** SSR route protection for /auth/settings
    // NOTE: This opts /auth/settings out of static rendering
    // It already handles client side protection via useAuthenticate
    if (pathname === "settings") {
        const sessionData = await auth.api.getSession({
            headers: await headers()
        })

        if (!sessionData) redirect("/auth/sign-in?redirectTo=/auth/settings")
    }

    // Get redirectTo from search params, default to /dashboard
    const redirectTo = (searchParamsData.redirectTo as string) || "/dashboard"

    // Keep original pathnames - no redirects

    return (
        <main className="container flex grow flex-col items-center justify-center gap-4 self-center p-4 md:p-6">
            <AuthCard
                pathname={pathname}
                redirectTo={redirectTo}
            />

            {["sign-in", "sign-up", "magic-link", "email-otp", "forgot-password"].includes(
                pathname
            ) && (
                <p className="text-muted-foreground text-xs">
                    Powered by{" "}
                    <Link
                        className="text-warning underline"
                        href="https://better-auth.com"
                        target="_blank"
                    >
                        better-auth.
                    </Link>
                </p>
            )}
        </main>
    )
}
