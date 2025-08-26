import { betterAuth } from "better-auth"
import { admin, organization, emailOTP } from "better-auth/plugins"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { stripe as stripePlugin } from "@better-auth/stripe"
import { nextCookies } from "better-auth/next-js"
import { eq } from "drizzle-orm"

import { db } from "@/database/db"
import * as schema from "@/database/schema"
import { sendOrganizationInvitation, sendOTPEmail } from "@/lib/email"
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
        const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
        
        // Handle invitation acceptance specifically
        if (url.pathname.includes('accept-invitation')) {
            return redirectTo;
        }
        
        // Prevent redirect loops to auth pages
        if (redirectTo.startsWith('/auth/')) {
            return '/dashboard';
        }
        
        return redirectTo;
    },
    database: drizzleAdapter(db, {
        provider: "pg",
        usePlural: true,
        schema,
        // debugLogs disabled for cleaner console output
        debugLogs: false
    }),
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 30 * 60, // 30 minutes - Better Auth recommended sweet spot for performance
        },
        freshTokenThreshold: 24 * 60 * 60, // 24 hours before refreshing tokens
        expiresIn: 30 * 24 * 60 * 60, // 30 days session expiry
        updateAge: 7 * 24 * 60 * 60, // Update session timestamp every 7 days
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true
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
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                await sendOTPEmail({ email, otp, type });
            },
            disableSignUp: false  // Allow creating new users via OTP
        }),
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
        })] : []),
        // Next.js cookie handling - must be last plugin
        nextCookies()
    ]
})
