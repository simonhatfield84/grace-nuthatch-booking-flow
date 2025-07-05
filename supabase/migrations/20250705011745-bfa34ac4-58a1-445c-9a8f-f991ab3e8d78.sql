
-- Complete database reset for clean setup
-- Delete all existing data in the correct order to avoid foreign key constraints

-- Delete user roles first
DELETE FROM public.user_roles;

-- Delete profiles
DELETE FROM public.profiles;

-- Delete approval tokens
DELETE FROM public.approval_tokens;

-- Delete venues
DELETE FROM public.venues;

-- Note: We cannot delete auth.users directly via SQL as it's managed by Supabase Auth
-- The user will need to delete any test users manually from the Supabase Auth dashboard
-- or we'll handle duplicate email errors gracefully in the code
