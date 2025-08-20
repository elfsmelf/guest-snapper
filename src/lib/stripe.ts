import Stripe from "stripe";

// Handle missing Stripe key for CLI operations
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-07-30.basil",
    })
  : null;