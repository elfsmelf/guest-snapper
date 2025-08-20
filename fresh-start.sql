-- Fresh start: Drop all tables and start clean
-- This will remove all users, events, and related data

BEGIN;

-- Drop all tables in dependency order
DROP TABLE IF EXISTS uploads CASCADE;
DROP TABLE IF EXISTS albums CASCADE;
DROP TABLE IF EXISTS guestbook_entries CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- Drop Better Auth tables
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS verifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any remaining tables
DROP TABLE IF EXISTS nodes CASCADE;
DROP TABLE IF EXISTS outbox CASCADE;

-- Drop the migration tracking table to start fresh
DROP TABLE IF EXISTS __drizzle_migrations CASCADE;

-- Drop any triggers/functions that might exist
DROP FUNCTION IF EXISTS public.outbox_notify() CASCADE;

SELECT 'All tables dropped successfully' as status;

COMMIT;