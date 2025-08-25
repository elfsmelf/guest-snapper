CREATE TABLE "guests" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"guest_name" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guestbook_entries" ADD COLUMN "anon_id" text;--> statement-breakpoint
ALTER TABLE "uploads" ADD COLUMN "anon_id" text;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;