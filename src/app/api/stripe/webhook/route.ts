import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/database/db";
import { events, users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { addMonths } from "date-fns";
import { getPlanFeatures } from "@/lib/pricing";
import { PostHog } from 'posthog-node'
import { inngest } from '@/inngest/client'

const posthogClient = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  { host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com' }
)

async function upgradeEvent(opts: {
  userId: string;
  eventId: string;
  plan: string;
  currency: string;
  stripeSessionId: string;
  paymentIntentId?: string;
  amountTotal?: number;
  isUpgrade?: boolean;
}) {
  const { userId, eventId, plan, currency, stripeSessionId, paymentIntentId, amountTotal, isUpgrade } = opts;

  try {
    // Verify user owns the event (defense-in-depth)
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)
      .then(results => results[0]);

    if (!event) {
      console.error(`Event ${eventId} not found`);
      return;
    }

    if (event.userId !== userId) {
      console.error(`User ${userId} does not own event ${eventId}`);
      return;
    }

    const previousPlan = event.plan || 'free_trial';

    // Get plan features for upload/download window calculation
    const planFeatures = getPlanFeatures(plan);
    const now = new Date();
    const activationDate = event.activationDate ? new Date(event.activationDate) : now;

    // Calculate new windows based on plan
    const uploadWindowEnd = addMonths(activationDate, planFeatures.uploadWindowMonths);
    const downloadWindowEnd = addMonths(activationDate, planFeatures.downloadWindowMonths);

    // Update event with paid plan and payment details
    await db
      .update(events)
      .set({
        plan,
        currency,
        paidAt: now.toISOString(),
        stripeSessionId,
        stripePaymentIntent: paymentIntentId || null,
        uploadWindowEnd: uploadWindowEnd.toISOString(),
        downloadWindowEnd: downloadWindowEnd.toISOString(),
        guestCount: planFeatures.guestLimit === 999999 ? 999999 : planFeatures.guestLimit,
        // Enable public access for paid plans
        isPublished: planFeatures.publicAccess ? event.isPublished : false,
        updatedAt: now.toISOString(),
      })
      .where(eq(events.id, eventId));

    console.log(`✅ Successfully upgraded event ${eventId} to ${plan} plan`);

    // Track payment event in PostHog
    if (isUpgrade && previousPlan !== 'free_trial' && previousPlan !== 'free') {
      // Existing paid plan being upgraded to higher tier
      posthogClient.capture({
        distinctId: userId,
        event: 'payment_upgrade_completed',
        properties: {
          event_id: eventId,
          plan: plan,
          previous_plan: previousPlan,
          currency: currency,
          amount: amountTotal ? amountTotal / 100 : undefined,
          stripe_session_id: stripeSessionId,
        }
      })
    } else {
      // First time payment (from free trial or free)
      posthogClient.capture({
        distinctId: userId,
        event: 'payment_success',
        properties: {
          event_id: eventId,
          plan: plan,
          previous_plan: previousPlan,
          currency: currency,
          amount: amountTotal ? amountTotal / 100 : undefined,
          stripe_session_id: stripeSessionId,
        }
      })
    }

    // Flush PostHog events
    await posthogClient.shutdown()

    // Trigger activation confirmation email workflow
    try {
      // Fetch user details from Better Auth users table
      const userRecord = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
        .then(results => results[0]);

      if (userRecord && userRecord.email && event.activationDate) {
        await inngest.send({
          name: "guestsnapper/gallery.activated",
          data: {
            eventId: event.id,
            userId: userId,
            userEmail: userRecord.email,
            userName: userRecord.name || userRecord.email.split('@')[0],
            eventName: event.name,
            eventSlug: event.slug,
            activationDate: event.activationDate,
          },
        });
        console.log('Activation confirmation email workflow triggered for event:', event.id);
      } else if (!event.activationDate) {
        console.log('Skipping activation email - no activation date set for event:', event.id);
      } else if (!userRecord?.email) {
        console.log('Skipping activation email - no email found for user:', userId);
      }
    } catch (inngestError) {
      // Log error but don't fail the request - email workflow is non-critical
      console.error('Failed to trigger activation confirmation workflow:', inngestError);
    }

  } catch (error) {
    console.error(`Failed to upgrade event ${eventId}:`, error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const sig = (await headers()).get("stripe-signature");
    if (!sig) {
      console.error("Missing stripe-signature header");
      return new NextResponse("Missing signature", { status: 400 });
    }

    const rawBody = await req.text();

  let event;
  try {
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`📦 Received webhook: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const paid = session.payment_status === "paid";

        console.log(`💳 Checkout session completed: ${session.id}, paid: ${paid}`);

        if (paid) {
          const userId = session.metadata?.userId;
          const eventId = session.metadata?.eventId;
          const plan = session.metadata?.plan;
          const currency = session.metadata?.currency;
          const isUpgrade = session.metadata?.isUpgrade === 'true';

          if (!userId || !eventId || !plan || !currency) {
            console.error("Missing required metadata in checkout session:", {
              userId, eventId, plan, currency
            });
            break;
          }

          await upgradeEvent({
            userId,
            eventId,
            plan,
            currency,
            stripeSessionId: session.id,
            paymentIntentId: session.payment_intent,
            amountTotal: session.amount_total,
            isUpgrade,
          });
        }
        break;
      }

      case "charge.dispute.created":
      case "charge.refunded": {
        const charge = event.data.object as any;
        console.log(`🔄 Handling refund/dispute for charge: ${charge.id}`);
        
        // Find the event associated with this charge
        const paymentIntentId = charge.payment_intent;
        if (paymentIntentId) {
          const relatedEvent = await db
            .select()
            .from(events)
            .where(eq(events.stripePaymentIntent, paymentIntentId))
            .limit(1)
            .then(results => results[0]);

          if (relatedEvent) {
            // Revert to free trial on refund
            await db
              .update(events)
              .set({
                plan: 'free_trial',
                paidAt: null,
                isPublished: false, // Free trial cannot be public
                guestCount: 999999, // Reset to unlimited guests
                updatedAt: new Date().toISOString(),
              })
              .where(eq(events.id, relatedEvent.id));

            console.log(`⬇️ Reverted event ${relatedEvent.id} to free trial due to refund`);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as any;
        console.log(`❌ Payment failed for intent: ${paymentIntent.id}`);
        // Could log this for analytics or customer support
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
        break;
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
  } catch (error) {
    console.error("Fatal webhook error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// Optional: Handle GET requests for debugging
export async function GET() {
  return new NextResponse("Stripe webhook endpoint - POST only", { status: 200 });
}

export const runtime = "nodejs"; // Ensure raw body support under App Router
export const dynamic = "force-dynamic";