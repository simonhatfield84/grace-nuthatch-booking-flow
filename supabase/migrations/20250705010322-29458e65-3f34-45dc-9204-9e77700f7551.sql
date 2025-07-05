
-- Temporarily disable RLS on venues table to allow setup process
ALTER TABLE public.venues DISABLE ROW LEVEL SECURITY;

-- Add a comment to track this temporary change
COMMENT ON TABLE public.venues IS 'RLS temporarily disabled for setup - re-enable before production';
