
-- Delete the incomplete venue record that's causing the duplicate slug error
DELETE FROM public.venues 
WHERE slug = 'the-nuthatch' 
AND approval_status = 'pending';

-- Also clean up any orphaned approval tokens for this venue
DELETE FROM public.approval_tokens 
WHERE venue_id IN (
  SELECT id FROM public.venues 
  WHERE slug = 'the-nuthatch' 
  AND approval_status = 'pending'
);
