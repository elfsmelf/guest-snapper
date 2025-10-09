import { inngest } from "./client";
import { sendActivationConfirmationEmail } from "@/lib/email";

interface GalleryActivatedPayload {
  eventId: string;
  userId: string;
  userEmail: string;
  userName: string;
  eventName: string;
  eventSlug: string;
  activationDate: string;
}

export const activationConfirmationWorkflow = inngest.createFunction(
  {
    id: "activation-confirmation-workflow",
    name: "Activation Confirmation Workflow",
  },
  { event: "guestsnapper/gallery.activated" },
  async ({ event, step }) => {
    const {
      eventId,
      userId,
      userEmail,
      userName,
      eventName,
      eventSlug,
      activationDate,
    } = event.data as GalleryActivatedPayload;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://guestsnapper.com";
    const dashboardLink = `${baseUrl}/dashboard`;

    await step.run("send-activation-confirmation", async () => {
      console.log(
        `Sending activation confirmation email to ${userEmail} for event ${eventId} (${eventName})`
      );

      await sendActivationConfirmationEmail({
        name: userName,
        email: userEmail,
        eventName,
        activationDate,
        dashboardLink,
      });

      return {
        emailType: "activation-confirmation",
        sent: true,
        eventId,
        eventName,
      };
    });

    return {
      eventId,
      userId,
      workflowCompleted: true,
    };
  }
);
