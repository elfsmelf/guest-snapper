import Link from "next/link"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

import { Button } from "./ui/button"
import { UserButton } from "@daveyplate/better-auth-ui"

export async function Header() {
    // Server-side authentication check
    const session = await auth.api.getSession({
        headers: await headers()
    })

    const user = session?.user

    return (
        <header className="sticky top-0 z-50 flex h-12 justify-between border-b bg-white px-safe-or-4 md:h-14 md:px-safe-or-6">
            <Link href="/" className="flex items-center">
                <span className="text-xl font-bold">Guest Snapper</span>
            </Link>

            <div className="flex items-center gap-2">
                {user ? (
                    <>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/dashboard">Dashboard</Link>
                        </Button>
                        <UserButton size="icon" />
                    </>
                ) : (
                    <>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/auth/sign-in">Login</Link>
                        </Button>
                        <Button asChild size="sm">
                            <Link href="/auth/sign-up">Create Account</Link>
                        </Button>
                    </>
                )}
                
            </div>
        </header>
    )
}
