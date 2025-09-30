import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/database/db";
import { events } from "@/database/schema";
import { eq } from "drizzle-orm";
import { addMonths } from "date-fns";
import { getPlanFeatures } from "@/lib/pricing";
import { PostHog } from 'posthog-node'

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
}) {
  const { userId, eventId, plan, currency, stripeSessionId, paymentIntentId } = opts;

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

    // Get plan features for upload/download window calculation
    const planFeatures = getPlanFeatures(plan);
    const now = new Date();
    const activationDate = event.activationDate ? new Date(event.activationDate) : now;

    // Calculate new windows based on plan
    // Check if plan has day-based window (shouldn't happen for paid plans, but be safe)
    let uploadWindowEnd: Date;
    if ('uploadWindowDays' in planFeatures && planFeatures.uploadWindowDays) {
      uploadWindowEnd = new Date(activationDate);
      uploadWindowEnd.setDate(uploadWindowEnd.getDate() + planFeatures.uploadWindowDays);
    } else {
      uploadWindowEnd = addMonths(activationDate, planFeatures.uploadWindowMonths);
    }
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

    // Track plan upgrade in PostHog
    posthogClient.capture({
      distinctId: userId,
      event: 'plan_upgraded',
      properties: {
        event_id: eventId,
        plan: plan,
        currency: currency,
        stripe_session_id: stripeSessionId,
        previous_plan: 'free_trial',
      }
    })

    // Flush PostHog events
    await posthogClient.shutdown()

  } catch (error) {
    console.error(`Failed to upgrade event ${eventId}:`, error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const sig = (await headers()).get("stripe-signature")!;
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
}

export const runtime = "nodejs"; // Ensure raw body support under App Router
export const dynamic = "force-dynamic";