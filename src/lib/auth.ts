import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { anonymous, organization } from "better-auth/plugins"
import { stripe as stripePlugin } from "@better-auth/stripe"

import { db } from "@/database/db"
import * as schema from "@/database/schema"
import { sendOrganizationInvitation } from "@/lib/email"
import { stripe } from "@/lib/stripe"

export const auth = betterAuth({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    trustedOrigins: [
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "https://guestsnapper.com",
        "https://www.guestsnapper.com"
    ],
    database: drizzleAdapter(db, {
        provider: "pg",
        usePlural: true,
        schema
    }),
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // Cache session for 5 minutes
        },
    },
    emailAndPassword: {
        enabled: true
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    plugins: [
        anonymous(),
        organization({
            allowUserToCreateOrganization: true,
            sendInvitationEmail: async (data) => {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                const inviteLink = `${baseUrl}/accept-invitation/${data.id}`
                
                try {
                    await sendOrganizationInvitation({
                        email: data.email,
                        inviterName: data.inviter.user.name || data.inviter.user.email || 'Someone',
                        organizationName: data.organization.name,
                        inviteLink,
                        role: data.role
                    })
                } catch (emailError) {
                    console.error('Failed to send invitation email, but continuing:', emailError)
                    // Don't throw the error - let the invitation be created even if email fails
                    console.log('Invitation created successfully, but email sending failed')
                }
            }
        }),
        (stripePlugin as any)({
            stripeClient: stripe,
            stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
            createCustomerOnSignUp: true,
        })
    ]
})
