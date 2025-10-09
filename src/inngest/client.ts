import { Inngest } from "inngest";

/**
 * Inngest client for Guest Snapper
 * Handles event-driven workflows for trial emails and lifecycle communications
 */
export const inngest = new Inngest({
  id: "guest-snapper",
  name: "Guest Snapper",
  // Event key is used for sending events to Inngest
  eventKey: process.env.INNGEST_EVENT_KEY,
});
