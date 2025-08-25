ALTER TABLE "events" ALTER COLUMN "approve_uploads" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "password";