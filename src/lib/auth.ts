import { betterAuth } from "better-auth"
import { admin, organization } from "better-auth/plugins"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { stripe as stripePlugin } from "@better-auth/stripe"

import { db } from "@/database/db"
import * as schema from "@/database/schema"
import { sendOrganizationInvitation } from "@/lib/email"
import { stripe } from "@/lib/stripe"
import { checkAndSetAdminRole, ensureAdminUsers } from "@/lib/ensure-admin-users"

export const auth = betterAuth({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    trustedOrigins: [
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "https://guestsnapper.com",
        "https://www.guestsnapper.com"
    ],
    onReady: async () => {
        // Automatically ensure admin users have correct roles on server start
        await ensureAdminUsers()
    },
    onSuccessRedirect: (request: any) => {
        // Get redirectTo from the URL or default to dashboard
        const url = new URL(request.url);
        console.log('onSuccessRedirect called with URL:', url.toString());
        console.log('URL pathname:', url.pathname);
        console.log('URL search params:', Object.fromEntries(url.searchParams.entries()));
        
        const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
        console.log('Resolved redirectTo:', redirectTo);
        
        // Handle invitation acceptance specifically
        if (url.pathname.includes('accept-invitation')) {
            console.log('Handling invitation acceptance, redirecting to:', redirectTo);
            return redirectTo;
        }
        
        // Prevent redirect loops to auth pages
        if (redirectTo.startsWith('/auth/')) {
            console.log('Preventing auth loop, redirecting to dashboard');
            return '/dashboard';
        }
        
        console.log('Final redirect target:', redirectTo);
        return redirectTo;
    },
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
    deleteUser: {
        enabled: true,
        beforeDelete: async (user: any) => {
            console.log('About to delete user:', user.email)
        },
        afterDelete: async (user: any) => {
            console.log('User deleted successfully:', user.email)
        }
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            callbackURL: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback/google`,
        } as any,
    },
    plugins: [
        admin({
            // Users with role 'admin' will have admin privileges
            // You can also use adminUserIds: ["user_id_1", "user_id_2"] for specific user IDs
        }),
        organization({
            allowUserToCreateOrganization: true,
            sendInvitationEmail: async (data) => {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                const inviteLink = `${baseUrl}/api/accept-invitation/${data.id}`
                
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
            },
            onInviteAccepted: async (data: any) => {
                console.log('Organization invitation accepted:', data)
                // This might not have redirect capability, but let's try logging
                return '/dashboard'
            }
        }),
        // Only include Stripe plugin if Stripe is configured
        ...(stripe ? [(stripePlugin as any)({
            stripeClient: stripe,
            stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
            createCustomerOnSignUp: true,
        })] : [])
    ]
})
