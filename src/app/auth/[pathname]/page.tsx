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
                localization={{
                    SIGN_IN: "Welcome to Guest Snapper",
                    SIGN_IN_DESCRIPTION: "Create your wedding photo gallery or access your existing one. Choose Google or enter your email to continue.",
                    SIGN_UP: "Welcome to Guest Snapper",
                    SIGN_UP_DESCRIPTION: "Create your wedding photo gallery or access your existing one. Choose Google or enter your email to continue.",
                    EMAIL_PLACEHOLDER: "Enter your email address",
                    MAGIC_LINK: "Continue with email",
                    MAGIC_LINK_DESCRIPTION: "Enter your email to continue",
                    MAGIC_LINK_ACTION: "Continue",
                    EMAIL_OTP: "Continue with email",
                    EMAIL_OTP_DESCRIPTION: "Enter your email to continue",
                    EMAIL_OTP_SEND_ACTION: "Send verification code",
                    EMAIL_OTP_VERIFY_ACTION: "Verify and continue",
                    OR_CONTINUE_WITH: "Or continue with",
                    SIGN_IN_WITH: "Continue with",
                    DONT_HAVE_AN_ACCOUNT: "New to Guest Snapper?",
                    ALREADY_HAVE_AN_ACCOUNT: "Already have an account?",
                    SIGN_IN_ACTION: "Continue",
                    SIGN_UP_ACTION: "Continue",
                    SIGN_IN_USERNAME_DESCRIPTION: "Enter your email to continue to your wedding gallery",
                }}
            />
        </main>
    )
}
