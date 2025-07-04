
-- Add new fields to guests table for import data
ALTER TABLE public.guests 
ADD COLUMN import_visit_count INTEGER DEFAULT NULL,
ADD COLUMN import_last_visit_date DATE DEFAULT NULL;

-- Create function to find duplicate guests by email or phone
CREATE OR REPLACE FUNCTION public.find_duplicate_guests(
  guest_email TEXT DEFAULT NULL,
  guest_phone TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  match_type TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.name,
    g.email,
    g.phone,
    g.created_at,
    CASE 
      WHEN LOWER(TRIM(g.email)) = LOWER(TRIM(guest_email)) AND g.email IS NOT NULL AND guest_email IS NOT NULL THEN 'email'
      WHEN TRIM(g.phone) = TRIM(guest_phone) AND g.phone IS NOT NULL AND guest_phone IS NOT NULL THEN 'phone'
      ELSE 'unknown'
    END as match_type
  FROM public.guests g
  WHERE 
    (guest_email IS NOT NULL AND LOWER(TRIM(g.email)) = LOWER(TRIM(guest_email))) OR
    (guest_phone IS NOT NULL AND TRIM(g.phone) = TRIM(guest_phone));
END;
$$;

-- Create function to merge two guest records
CREATE OR REPLACE FUNCTION public.merge_guests(
  primary_guest_id UUID,
  duplicate_guest_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  primary_guest RECORD;
  duplicate_guest RECORD;
BEGIN
  -- Get both guest records
  SELECT * INTO primary_guest FROM public.guests WHERE id = primary_guest_id;
  SELECT * INTO duplicate_guest FROM public.guests WHERE id = duplicate_guest_id;
  
  -- Update primary guest with best available data
  UPDATE public.guests SET
    name = COALESCE(
      CASE WHEN LENGTH(TRIM(primary_guest.name)) > LENGTH(TRIM(duplicate_guest.name)) 
           THEN primary_guest.name 
           ELSE duplicate_guest.name 
      END,
      primary_guest.name
    ),
    email = COALESCE(primary_guest.email, duplicate_guest.email),
    phone = COALESCE(primary_guest.phone, duplicate_guest.phone),
    notes = CASE 
      WHEN primary_guest.notes IS NOT NULL AND duplicate_guest.notes IS NOT NULL 
      THEN primary_guest.notes || E'\n--- Merged Notes ---\n' || duplicate_guest.notes
      ELSE COALESCE(primary_guest.notes, duplicate_guest.notes)
    END,
    import_visit_count = GREATEST(
      COALESCE(primary_guest.import_visit_count, 0),
      COALESCE(duplicate_guest.import_visit_count, 0)
    ),
    import_last_visit_date = GREATEST(
      primary_guest.import_last_visit_date,
      duplicate_guest.import_last_visit_date
    ),
    updated_at = NOW()
  WHERE id = primary_guest_id;
  
  -- Transfer guest_tags from duplicate to primary (avoid duplicates)
  INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by, assigned_at)
  SELECT primary_guest_id, tag_id, assigned_by, assigned_at
  FROM public.guest_tags 
  WHERE guest_id = duplicate_guest_id
  AND NOT EXISTS (
    SELECT 1 FROM public.guest_tags 
    WHERE guest_id = primary_guest_id AND tag_id = guest_tags.tag_id
  );
  
  -- Delete the duplicate guest (this will cascade delete guest_tags due to foreign key)
  DELETE FROM public.guests WHERE id = duplicate_guest_id;
  
  RETURN primary_guest_id;
END;
$$;
