CREATE TABLE "deletion_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text,
	"action" text NOT NULL,
	"reason" text,
	"executed_at" timestamp DEFAULT now() NOT NULL,
	"metadata" text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "is_anonymous" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "trashed_at" timestamp;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "delete_at" timestamp;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "deletion_events" ADD CONSTRAINT "deletion_events_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;