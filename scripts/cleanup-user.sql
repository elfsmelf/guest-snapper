-- Script to clean up all traces of elfsmelf@gmail.com from Better Auth tables
-- This fixes the "unable_to_create_user" error when trying to recreate an account

BEGIN;

-- Show what we're about to delete
SELECT 'Users with email elfsmelf@gmail.com:' as info;
SELECT id, name, email, created_at FROM users WHERE email = 'elfsmelf@gmail.com';

SELECT 'Events created by this user:' as info;
SELECT e.id, e.name, e.couple_names, e.created_at 
FROM events e 
JOIN users u ON e.user_id = u.id 
WHERE u.email = 'elfsmelf@gmail.com';

-- Get user IDs for cleanup
CREATE TEMP TABLE users_to_delete AS 
SELECT id FROM users WHERE email = 'elfsmelf@gmail.com';

-- Clean up Better Auth related data in the correct order
-- 1. Delete verifications (email verification records that might conflict)
DELETE FROM verifications WHERE identifier = 'elfsmelf@gmail.com';
SELECT 'Deleted verification records' as status;

-- 2. Delete invitations where this user was the inviter
DELETE FROM invitations WHERE inviter_id IN (SELECT id FROM users_to_delete);
SELECT 'Deleted invitation records' as status;

-- 3. Delete organization memberships
DELETE FROM members WHERE user_id IN (SELECT id FROM users_to_delete);
SELECT 'Deleted organization memberships' as status;

-- 4. Delete user accounts (OAuth connections)
DELETE FROM accounts WHERE user_id IN (SELECT id FROM users_to_delete);
SELECT 'Deleted OAuth account connections' as status;

-- 5. Delete active sessions
DELETE FROM sessions WHERE user_id IN (SELECT id FROM users_to_delete);
SELECT 'Deleted user sessions' as status;

-- 6. Delete uploads (should cascade via events, but let's be explicit)
DELETE FROM uploads WHERE event_id IN (
    SELECT e.id FROM events e WHERE e.user_id IN (SELECT id FROM users_to_delete)
);
SELECT 'Deleted upload records' as status;

-- 7. Delete albums (should cascade via events, but let's be explicit)
DELETE FROM albums WHERE event_id IN (
    SELECT e.id FROM events e WHERE e.user_id IN (SELECT id FROM users_to_delete)
);
SELECT 'Deleted album records' as status;

-- 8. Delete events
DELETE FROM events WHERE user_id IN (SELECT id FROM users_to_delete);
SELECT 'Deleted event records' as status;

-- 9. Finally delete the user records
DELETE FROM users WHERE id IN (SELECT id FROM users_to_delete);
SELECT 'Deleted user records' as status;

-- Verify cleanup
SELECT 'Verification - should show 0 results:' as verification;
SELECT COUNT(*) as remaining_users FROM users WHERE email = 'elfsmelf@gmail.com';
SELECT COUNT(*) as remaining_verifications FROM verifications WHERE identifier = 'elfsmelf@gmail.com';

SELECT 'Cleanup complete! The email elfsmelf@gmail.com can now be used to create a new account.' as result;

COMMIT;