import { stripe } from "@/lib/stripe";
import { db } from "@/database/db";
import { users } from "@/../auth-schema";
import { eq } from "drizzle-orm";

/**
 * Get or create a Stripe customer for a user
 * This ensures each user has exactly one Stripe customer ID
 */
export async function getOrCreateStripeCustomer(userId: string, email: string, name?: string): Promise<string> {
  // First, check if user already has a Stripe customer ID
  const user = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then(results => results[0]);

  if (user?.stripeCustomerId) {
    // Verify the customer still exists in Stripe
    try {
      if (!stripe) {
        throw new Error('Stripe is not configured');
      }
      await stripe.customers.retrieve(user.stripeCustomerId);
      return user.stripeCustomerId;
    } catch (error) {
      console.warn(`Stripe customer ${user.stripeCustomerId} not found, creating new one`);
      // Customer doesn't exist in Stripe, create a new one
    }
  }

  // Create new Stripe customer
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
      app: 'guestsnapper'
    }
  });

  // Save customer ID to database
  await db
    .update(users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(users.id, userId));

  console.log(`✅ Created Stripe customer ${customer.id} for user ${userId}`);

  return customer.id;
}

/**
 * Get Stripe customer ID for a user (returns null if not found)
 */
export async function getStripeCustomerId(userId: string): Promise<string | null> {
  const user = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then(results => results[0]);

  return user?.stripeCustomerId || null;
}
