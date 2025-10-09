import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
// Import workflow functions (will be created in next steps)
import { trialEmailWorkflow } from "@/inngest/trial-emails";
import { activationConfirmationWorkflow } from "@/inngest/activation-emails";

/**
 * Inngest API route for Guest Snapper
 * This endpoint serves the Inngest functions and handles webhook events
 *
 * In development: npx inngest-cli@latest dev
 * In production: Inngest Cloud handles execution
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    trialEmailWorkflow,
    activationConfirmationWorkflow,
  ],
  // Signing key for verifying requests from Inngest
  signingKey: process.env.INNGEST_SIGNING_KEY,
  // Streaming enables better performance for long-running functions
  streaming: "allow",
});
