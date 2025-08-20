import { createAuthClient } from "better-auth/react"
import { adminClient, anonymousClient, organizationClient } from "better-auth/client/plugins"
import { stripeClient } from "@better-auth/stripe/client"

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    plugins: [
        adminClient(),
        anonymousClient(),
        organizationClient(),
        (stripeClient as any)()
    ]
})
