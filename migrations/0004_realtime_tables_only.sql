-- Create real-time tables for Ably LiveSync
CREATE TABLE IF NOT EXISTS "nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"expiry" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "outbox" (
	"sequence_id" serial PRIMARY KEY NOT NULL,
	"mutation_id" text NOT NULL,
	"channel" text NOT NULL,
	"name" text NOT NULL,
	"rejected" boolean DEFAULT false NOT NULL,
	"data" jsonb,
	"headers" jsonb,
	"locked_by" text,
	"lock_expiry" timestamp,
	"processed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT NOW() NOT NULL
);

-- Create trigger function for outbox notifications
CREATE OR REPLACE FUNCTION public.outbox_notify() 
RETURNS trigger AS $$
BEGIN 
  PERFORM pg_notify('ably_adbc'::text, ''::text); 
  RETURN NULL; 
EXCEPTION 
  WHEN others THEN 
    RAISE WARNING 'unexpected error in outbox_notify(): %', SQLERRM; 
    RETURN NULL; 
END; 
$$ LANGUAGE plpgsql;

-- Create trigger for outbox table
DROP TRIGGER IF EXISTS public_outbox_trigger ON public.outbox;
CREATE TRIGGER public_outbox_trigger 
  AFTER INSERT ON public.outbox 
  FOR EACH STATEMENT 
  EXECUTE PROCEDURE public.outbox_notify();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_outbox_channel ON outbox(channel);
CREATE INDEX IF NOT EXISTS idx_outbox_processed ON outbox(processed);
CREATE INDEX IF NOT EXISTS idx_outbox_sequence ON outbox(sequence_id);
CREATE INDEX IF NOT EXISTS idx_nodes_expiry ON nodes(expiry);