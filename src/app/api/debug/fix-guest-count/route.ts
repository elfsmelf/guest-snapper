import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/database/db";
import { events } from "@/database/schema";
import { eq } from "drizzle-orm";
import { getPlanFeatures } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({
        error: "Missing eventId"
      }, { status: 400 });
    }

    // Get the event
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

    // Get the correct guest count for the plan
    const planFeatures = getPlanFeatures(event.plan || 'free_trial');
    const correctGuestCount = planFeatures.guestLimit === 999999 ? 999999 : planFeatures.guestLimit;

    console.log(`Debug: Event ${eventId} has plan "${event.plan}" which should have ${correctGuestCount} guests, but database shows ${event.guestCount}`);

    // Update the guest count
    await db
      .update(events)
      .set({
        guestCount: correctGuestCount,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(events.id, eventId));

    return NextResponse.json({
      success: true,
      eventId,
      plan: event.plan,
      oldGuestCount: event.guestCount,
      newGuestCount: correctGuestCount,
    });

  } catch (err: any) {
    console.error("Fix guest count error:", err);
    return NextResponse.json({
      error: err.message || "Failed to fix guest count"
    }, { status: 500 });
  }
}