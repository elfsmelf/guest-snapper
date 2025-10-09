import { inngest } from "./client";
import { db } from "@/database/db";
import { events } from "@/database/schema";
import { eq } from "drizzle-orm";
import {
  sendTrialWelcomeEmail,
  sendTrialDay2TipsEmail,
  sendTrialDay4ValueEmail,
  sendTrialDay6EndingEmail,
} from "@/lib/email";

interface EventCreatedPayload {
  eventId: string;
  userId: string;
  userEmail: string;
  userName: string;
  eventSlug: string;
  createdAt: string;
}

export const trialEmailWorkflow = inngest.createFunction(
  {
    id: "trial-email-workflow",
    name: "Trial Email Workflow",
  },
  { event: "guestsnapper/event.created" },
  async ({ event, step }) => {
    const {
      eventId,
      userId,
      userEmail,
      userName,
      eventSlug,
      createdAt,
    } = event.data as EventCreatedPayload;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://guestsnapper.com";
    const dashboardLink = `${baseUrl}/dashboard`;
    const pricingLink = `${baseUrl}/${eventSlug}?pricing=true`;

    // Helper function to check if event has been upgraded
    const isEventUpgraded = async (): Promise<boolean> => {
      const [eventRecord] = await db
        .select({ paidAt: events.paidAt })
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      return eventRecord?.paidAt !== null;
    };

    // Day 0: Welcome email (send immediately)
    await step.run("send-welcome-email", async () => {
      console.log(`Sending welcome email to ${userEmail} for event ${eventId}`);

      await sendTrialWelcomeEmail({
        name: userName,
        email: userEmail,
        dashboardLink,
      });

      return { emailType: "welcome", sent: true };
    });

    // Day 2: Tips email
    const day2Date = new Date(createdAt);
    day2Date.setDate(day2Date.getDate() + 2);

    await step.sleepUntil("wait-for-day-2", day2Date);

    // Check if user upgraded before sending
    const upgradedBeforeDay2 = await step.run("check-upgrade-day-2", async () => {
      return await isEventUpgraded();
    });

    if (!upgradedBeforeDay2) {
      await step.run("send-day-2-email", async () => {
        console.log(`Sending day 2 tips email to ${userEmail} for event ${eventId}`);

        await sendTrialDay2TipsEmail({
          name: userName,
          email: userEmail,
          dashboardLink,
        });

        return { emailType: "day-2-tips", sent: true };
      });
    } else {
      console.log(`User ${userId} upgraded before day 2, skipping email`);
    }

    // Day 4: Value email
    const day4Date = new Date(createdAt);
    day4Date.setDate(day4Date.getDate() + 4);

    await step.sleepUntil("wait-for-day-4", day4Date);

    const upgradedBeforeDay4 = await step.run("check-upgrade-day-4", async () => {
      return await isEventUpgraded();
    });

    if (!upgradedBeforeDay4) {
      await step.run("send-day-4-email", async () => {
        console.log(`Sending day 4 value email to ${userEmail} for event ${eventId}`);

        await sendTrialDay4ValueEmail({
          name: userName,
          email: userEmail,
          dashboardLink,
        });

        return { emailType: "day-4-value", sent: true };
      });
    } else {
      console.log(`User ${userId} upgraded before day 4, skipping email`);
    }

    // Day 6: Trial ending email
    const day6Date = new Date(createdAt);
    day6Date.setDate(day6Date.getDate() + 6);

    await step.sleepUntil("wait-for-day-6", day6Date);

    const upgradedBeforeDay6 = await step.run("check-upgrade-day-6", async () => {
      return await isEventUpgraded();
    });

    if (!upgradedBeforeDay6) {
      await step.run("send-day-6-email", async () => {
        console.log(`Sending day 6 ending email to ${userEmail} for event ${eventId}`);

        await sendTrialDay6EndingEmail({
          name: userName,
          email: userEmail,
          dashboardLink,
          pricingLink,
        });

        return { emailType: "day-6-ending", sent: true };
      });
    } else {
      console.log(`User ${userId} upgraded before day 6, skipping email`);
    }

    return {
      eventId,
      userId,
      workflowCompleted: true,
    };
  }
);
