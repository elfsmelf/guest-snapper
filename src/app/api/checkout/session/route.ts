import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { db } from "@/database/db";
import { events } from "@/database/schema";
import { eq } from "drizzle-orm";
import { addMonths } from "date-fns";
import { getPlanFeatures } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { session_id } = await req.json();
    
    if (!session_id) {
      return NextResponse.json({ 
        error: "Missing session_id" 
      }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }
    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

    // Verify this session belongs to the current user
    if (checkoutSession.metadata?.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If payment is successful, ensure database is updated (fallback for webhook failures)
    if (checkoutSession.payment_status === 'paid' && checkoutSession.metadata?.eventId && checkoutSession.metadata?.plan) {
      const eventId = checkoutSession.metadata.eventId;
      const plan = checkoutSession.metadata.plan;
      const currency = checkoutSession.metadata.currency;

      try {
        // Check if event is already upgraded
        const event = await db
          .select()
          .from(events)
          .where(eq(events.id, eventId))
          .limit(1)
          .then(results => results[0]);

        const planFeatures = getPlanFeatures(plan);
        console.log(`📊 Event check: Current plan="${event?.plan}", Target plan="${plan}", Guest count="${event?.guestCount}"`);

        if (event && (event.plan !== plan || event.guestCount !== planFeatures.guestLimit)) {
          // Event needs to be upgraded OR guest count needs fixing
          console.log(`🔄 Fallback: Upgrading event ${eventId} to ${plan} plan (plan mismatch: ${event.plan !== plan}, guest count mismatch: ${event.guestCount !== planFeatures.guestLimit})`);
          const now = new Date();
          const activationDate = event.activationDate ? new Date(event.activationDate) : now;

          const uploadWindowEnd = addMonths(activationDate, planFeatures.uploadWindowMonths);
          const downloadWindowEnd = addMonths(activationDate, planFeatures.downloadWindowMonths);

          await db
            .update(events)
            .set({
              plan,
              currency,
              paidAt: now.toISOString(),
              stripeSessionId: checkoutSession.id,
              stripePaymentIntent: checkoutSession.payment_intent as string || null,
              uploadWindowEnd: uploadWindowEnd.toISOString(),
              downloadWindowEnd: downloadWindowEnd.toISOString(),
              guestCount: planFeatures.guestLimit === 999999 ? 999999 : planFeatures.guestLimit,
              isPublished: planFeatures.publicAccess ? event.isPublished : false,
              updatedAt: now.toISOString(),
            })
            .where(eq(events.id, eventId));

          console.log(`✅ Successfully upgraded event ${eventId} to ${plan} plan via fallback`);
        }
      } catch (error) {
        console.error('Error in fallback database update:', error);
        // Don't fail the response if database update fails
      }
    }

    return NextResponse.json({
      id: checkoutSession.id,
      payment_status: checkoutSession.payment_status,
      amount_total: checkoutSession.amount_total,
      currency: checkoutSession.currency,
      customer_email: checkoutSession.customer_email,
      metadata: checkoutSession.metadata,
    });

  } catch (err: any) {
    console.error("Session verification error:", err);
    return NextResponse.json({ 
      error: err.message || "Failed to verify session" 
    }, { status: 500 });
  }
}