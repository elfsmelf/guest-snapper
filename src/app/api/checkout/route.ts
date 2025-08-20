import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { getPriceId, getUpgradePrice, isPlanUpgrade, type Plan, type Currency } from "@/lib/pricing";
import { db } from "@/database/db";
import { events } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, currency, eventId } = await req.json();
    
    console.log('Checkout request:', { plan, currency, eventId });

    if (!plan || !currency || !eventId) {
      return NextResponse.json({ 
        error: "Missing required fields: plan, currency, eventId" 
      }, { status: 400 });
    }

    // Validate event ownership
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)
      .then(results => results[0]);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle plan upgrades vs new purchases
    const currentPlan = event.plan || 'free';
    const isUpgrade = currentPlan !== 'free' && event.paidAt;
    
    // Validate that this is a valid upgrade
    if (isUpgrade && !isPlanUpgrade(currentPlan, plan as Plan)) {
      return NextResponse.json({ 
        error: "Can only upgrade to a higher plan. Contact support for downgrades." 
      }, { status: 400 });
    }
    
    // Prevent duplicate payments to same plan
    if (currentPlan === plan) {
      return NextResponse.json({ 
        error: "Event is already on this plan" 
      }, { status: 400 });
    }

    // Calculate the price (full price or upgrade difference)
    const upgradePrice = getUpgradePrice(currentPlan, plan as Plan, currency as Currency);
    console.log('Price calculation:', { currentPlan, plan, currency, upgradePrice, isUpgrade });
    
    // For upgrades, create custom line item with upgrade price
    let lineItems;
    let sessionMetadata;
    
    if (isUpgrade && upgradePrice > 0) {
      // Create custom line item for upgrade
      lineItems = [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `Upgrade to ${plan} Plan`,
            description: `Upgrade from ${currentPlan} to ${plan} plan`,
            metadata: {
              type: 'plan_upgrade',
              from_plan: currentPlan,
              to_plan: plan,
              event_id: eventId
            }
          },
          unit_amount: upgradePrice,
        },
        quantity: 1,
      }];
      
      sessionMetadata = {
        userId: session.user.id,
        eventId,
        plan,
        currency,
        isUpgrade: 'true',
        fromPlan: currentPlan,
        upgradePrice: upgradePrice.toString()
      };
    } else {
      // Use standard Stripe price for new purchases
      const priceId = getPriceId(plan as Plan, currency as Currency);
      console.log('Price ID lookup:', { plan, currency, priceId });
      
      if (!priceId || !priceId.startsWith('price_')) {
        return NextResponse.json({ 
          error: "Invalid plan or currency, or Stripe prices not configured" 
        }, { status: 400 });
      }
      
      lineItems = [{ price: priceId, quantity: 1 }];
      sessionMetadata = {
        userId: session.user.id,
        eventId,
        plan,
        currency,
        isUpgrade: 'false'
      };
    }

    // Create Stripe checkout session
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: session.user.email,
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/events/${eventId}?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/events/${eventId}?payment_cancelled=true`,
      metadata: sessionMetadata,
      billing_address_collection: "auto",
    });

    // Store checkout session ID for tracking
    await db
      .update(events)
      .set({ stripeSessionId: checkoutSession.id })
      .where(eq(events.id, eventId));

    return NextResponse.json({ url: checkoutSession.url });

  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ 
      error: err.message || "Failed to create checkout session" 
    }, { status: 500 });
  }
}