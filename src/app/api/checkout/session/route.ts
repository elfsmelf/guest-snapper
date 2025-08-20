import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";

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