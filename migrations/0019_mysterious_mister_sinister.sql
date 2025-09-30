ALTER TABLE "events" ALTER COLUMN "plan" SET DEFAULT 'free_trial';--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "guest_can_view_guestbook" boolean DEFAULT true;