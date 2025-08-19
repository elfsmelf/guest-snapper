DROP TABLE "nodes" CASCADE;--> statement-breakpoint
DROP TABLE "outbox" CASCADE;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "plan" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "currency" text DEFAULT 'AUD' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "stripe_session_id" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "stripe_payment_intent" text;