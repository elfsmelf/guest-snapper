-- Initialize tables for Ably LiveSync real-time functionality

-- Create outbox table for event sourcing
CREATE TABLE IF NOT EXISTS outbox (
  sequence_id SERIAL PRIMARY KEY,
  mutation_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  name TEXT NOT NULL,
  rejected BOOLEAN NOT NULL DEFAULT false,
  data JSONB,
  headers JSONB,
  locked_by TEXT,
  lock_expiry TIMESTAMP WITHOUT TIME ZONE,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Create nodes table for distributed locking
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  expiry TIMESTAMP WITHOUT TIME ZONE NOT NULL
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

-- Insert a test record to verify setup (optional)
-- INSERT INTO outbox (mutation_id, channel, name, data, headers) 
-- VALUES ('test-init', 'system:test', 'init', '{"message": "Real-time setup complete"}', '{}');

COMMIT;