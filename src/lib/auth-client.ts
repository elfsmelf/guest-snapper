import { createAuthClient } from "better-auth/react"
import { adminClient, organizationClient, inferAdditionalFields, emailOTPClient } from "better-auth/client/plugins"
import { stripeClient } from "@better-auth/stripe/client"
import type { auth } from "./auth"

// Create the auth client with proper type inference
const client = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    plugins: [
        emailOTPClient(),
        adminClient(),
        organizationClient(),
        inferAdditionalFields<typeof auth>(),
        (stripeClient as any)()
    ]
})

// Export with proper typing
export const authClient = client

// Export inferred types
export type AuthClientType = typeof client
export type Session = typeof client.$Infer.Session
export type User = Session['user']
