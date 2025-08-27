import { createAuthClient } from "better-auth/react"
import { adminClient, inferAdditionalFields, emailOTPClient } from "better-auth/client/plugins"
import { stripeClient } from "@better-auth/stripe/client"
import type { auth } from "./auth"

// Create the auth client with proper type inference following Better Auth best practices
// Better Auth handles optimization internally via nanostore - no custom fetch options needed
// NOTE: organizationClient removed to prevent unnecessary organization API calls
// Organization features use manual API calls via fetchOrganizationData()
const client = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    plugins: [
        emailOTPClient(),
        adminClient(),
        inferAdditionalFields<typeof auth>(),
        (stripeClient as any)()
    ]
    // Let Better Auth handle session optimization and reactivity natively
    // The nanostore-based reactivity ensures session changes are reflected immediately
})

// Export with proper typing
export const authClient = client

// Export inferred types
export type AuthClientType = typeof client
export type Session = typeof client.$Infer.Session
export type User = Session['user']
