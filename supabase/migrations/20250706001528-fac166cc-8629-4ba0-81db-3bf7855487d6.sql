
-- Re-enable Row Level Security on venues table
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Update the table comment to reflect that RLS is now properly enabled for production
COMMENT ON TABLE public.venues IS 'RLS enabled - venue data is properly secured with row-level security policies';
