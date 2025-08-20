-- Add status tracking and scheduled deletion columns to events table
ALTER TABLE "events" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;
ALTER TABLE "events" ADD COLUMN "trashed_at" timestamp;
ALTER TABLE "events" ADD COLUMN "delete_at" timestamp;

-- Create deletion events log table for audit trail
CREATE TABLE IF NOT EXISTS "deletion_events" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text,
	"action" text NOT NULL,
	"reason" text,
	"executed_at" timestamp DEFAULT now() NOT NULL,
	"metadata" text DEFAULT '{}' NOT NULL
);

-- Add foreign key constraint
ALTER TABLE "deletion_events" ADD CONSTRAINT "deletion_events_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE set null ON UPDATE no action;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS "deletion_events_event_id_idx" ON "deletion_events" ("event_id");
CREATE INDEX IF NOT EXISTS "deletion_events_action_idx" ON "deletion_events" ("action");
CREATE INDEX IF NOT EXISTS "events_status_idx" ON "events" ("status");
CREATE INDEX IF NOT EXISTS "events_delete_at_idx" ON "events" ("delete_at");