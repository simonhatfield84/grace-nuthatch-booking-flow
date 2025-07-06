
-- Clear all guest data and related records
DELETE FROM public.guest_tags;
DELETE FROM public.guests;

-- Reset any sequences if needed (though guests table uses UUID primary keys)
-- This ensures a clean slate for production data

-- Verify the cleanup
SELECT 
  'guests' as table_name, 
  COUNT(*) as record_count 
FROM public.guests
UNION ALL
SELECT 
  'guest_tags' as table_name, 
  COUNT(*) as record_count 
FROM public.guest_tags;
