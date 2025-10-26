-- ============================================
-- COMPREHENSIVE SECURITY FIX MIGRATION
-- Addresses: Verification codes, Payment intents, SQL injection, Guest access
-- ============================================

-- ============================================
-- PART 1: Lock down email_verification_codes
-- ============================================

-- Enable RLS if not already enabled
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Drop any permissive policies
DROP POLICY IF EXISTS "Anyone can verify codes" ON public.email_verification_codes;
DROP POLICY IF EXISTS "System functions can manage verification codes" ON public.email_verification_codes;

-- Only service_role can access (via edge functions)
CREATE POLICY "service_role_manages_verification_codes"
  ON public.email_verification_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.email_verification_codes IS 'Verification codes - ONLY accessible via edge functions with service role. Never query directly from client.';


-- ============================================
-- PART 2: Fix payment_requests RLS policies
-- ============================================

-- Remove dangerous "System can manage" policy
DROP POLICY IF EXISTS "System can manage payment requests" ON public.payment_requests;

-- Service role for edge functions/webhooks
CREATE POLICY "service_role_manages_payment_requests"
  ON public.payment_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Venue admins can view their payment requests
CREATE POLICY "venue_admins_view_payment_requests"
  ON public.payment_requests
  FOR SELECT
  TO authenticated
  USING (
    venue_id = public.get_user_venue(auth.uid())
    AND public.is_admin(auth.uid(), venue_id)
  );

-- Venue staff can create payment requests for their venue
CREATE POLICY "venue_staff_create_payment_requests"
  ON public.payment_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    venue_id = public.get_user_venue(auth.uid())
  );


-- ============================================
-- PART 3: Fix guests table - venue-scoped access
-- ============================================

-- Remove permissive policies
DROP POLICY IF EXISTS "Allow all users to view guests" ON public.guests;
DROP POLICY IF EXISTS "Allow all users to delete guests" ON public.guests;
DROP POLICY IF EXISTS "Venue users can manage guests" ON public.guests;
DROP POLICY IF EXISTS "Authenticated venue users can view guests" ON public.guests;

-- Venue-scoped access only
CREATE POLICY "venue_users_view_their_guests"
  ON public.guests
  FOR SELECT
  TO authenticated
  USING (venue_id = public.get_user_venue(auth.uid()));

CREATE POLICY "venue_staff_manage_guests"
  ON public.guests
  FOR ALL
  TO authenticated
  USING (venue_id = public.get_user_venue(auth.uid()))
  WITH CHECK (venue_id = public.get_user_venue(auth.uid()));

-- Privacy-safe RPC for booking widget (returns only boolean, no PII)
CREATE OR REPLACE FUNCTION public.check_returning_guest(
  check_email TEXT,
  check_phone TEXT,
  check_venue_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exists_flag BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.guests
    WHERE venue_id = check_venue_id
      AND (
        (email IS NOT NULL AND LOWER(email) = LOWER(check_email)) OR
        (phone IS NOT NULL AND phone = check_phone)
      )
  ) INTO exists_flag;

  RETURN jsonb_build_object('is_returning', exists_flag);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_returning_guest(TEXT, TEXT, UUID) TO anon, authenticated;

COMMENT ON FUNCTION public.check_returning_guest IS 'Privacy-safe guest lookup for booking widget. Returns only boolean, never exposes PII.';


-- ============================================
-- PART 4: Fix SECURITY DEFINER functions - add search_path
-- Protects against SQL injection via search_path manipulation
-- ============================================

-- Function 1: generate_verification_code
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$;

-- Function 2: create_verification_code
CREATE OR REPLACE FUNCTION public.create_verification_code(user_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- Generate new code
  new_code := public.generate_verification_code();
  
  -- Clean up old codes for this email
  DELETE FROM public.email_verification_codes 
  WHERE email = user_email AND expires_at < NOW();
  
  -- Insert new code
  INSERT INTO public.email_verification_codes (email, code)
  VALUES (user_email, new_code);
  
  RETURN new_code;
END;
$$;

-- Function 3: verify_code
CREATE OR REPLACE FUNCTION public.verify_code(user_email text, submitted_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_record RECORD;
BEGIN
  -- Find the latest unused code for this email
  SELECT * INTO code_record
  FROM public.email_verification_codes
  WHERE email = user_email 
    AND code = submitted_code
    AND used_at IS NULL
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no valid code found
  IF code_record IS NULL THEN
    -- Increment attempts for existing codes
    UPDATE public.email_verification_codes
    SET attempts = attempts + 1
    WHERE email = user_email AND used_at IS NULL;
    
    RETURN FALSE;
  END IF;
  
  -- Mark code as used
  UPDATE public.email_verification_codes
  SET used_at = NOW()
  WHERE id = code_record.id;
  
  RETURN TRUE;
END;
$$;

-- Function 4: calculate_guest_stats
CREATE OR REPLACE FUNCTION public.calculate_guest_stats(guest_email text, guest_phone text)
RETURNS TABLE(
  visit_count integer, 
  last_visit_date date, 
  no_show_count integer, 
  early_bird_count integer, 
  last_minute_count integer, 
  bulk_booking_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as visit_count,
    MAX(booking_date)::DATE as last_visit_date,
    COUNT(CASE WHEN status = 'no_show' THEN 1 END)::INTEGER as no_show_count,
    COUNT(CASE WHEN booking_time < '18:00'::TIME THEN 1 END)::INTEGER as early_bird_count,
    COUNT(CASE WHEN created_at >= (booking_date + booking_time - INTERVAL '24 hours') THEN 1 END)::INTEGER as last_minute_count,
    COUNT(CASE WHEN party_size >= 8 THEN 1 END)::INTEGER as bulk_booking_count
  FROM public.bookings 
  WHERE (email = guest_email OR phone = guest_phone)
    AND status IN ('confirmed', 'finished', 'no_show');
END;
$$;

-- Function 5: merge_guests
CREATE OR REPLACE FUNCTION public.merge_guests(primary_guest_id uuid, duplicate_guest_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by, assigned_at, venue_id)
  SELECT primary_guest_id, tag_id, assigned_by, assigned_at, venue_id
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

-- Function 6: assign_automatic_tags
CREATE OR REPLACE FUNCTION public.assign_automatic_tags(guest_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guest_record RECORD;
  stats_record RECORD;
  tag_record RECORD;
BEGIN
  -- Get guest info
  SELECT * INTO guest_record FROM public.guests WHERE id = guest_id_param;
  
  -- Get guest statistics
  SELECT * INTO stats_record FROM public.calculate_guest_stats(guest_record.email, guest_record.phone);
  
  -- Remove all existing automatic tags for this guest
  DELETE FROM public.guest_tags 
  WHERE guest_id = guest_id_param 
    AND assigned_by = 'system';
  
  -- Assign tags based on criteria
  FOR tag_record IN SELECT * FROM public.tags WHERE is_automatic = true LOOP
    CASE tag_record.name
      WHEN 'First-Time' THEN
        IF stats_record.visit_count = 1 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by, venue_id) 
          VALUES (guest_id_param, tag_record.id, 'system', guest_record.venue_id);
        END IF;
      
      WHEN 'Repeat' THEN
        IF stats_record.visit_count BETWEEN 2 AND 4 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by, venue_id) 
          VALUES (guest_id_param, tag_record.id, 'system', guest_record.venue_id);
        END IF;
      
      WHEN 'Frequent' THEN
        IF stats_record.visit_count >= 5 AND stats_record.last_visit_date >= CURRENT_DATE - INTERVAL '6 months' THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by, venue_id) 
          VALUES (guest_id_param, tag_record.id, 'system', guest_record.venue_id);
        END IF;
      
      WHEN 'Recent' THEN
        IF stats_record.last_visit_date >= CURRENT_DATE - INTERVAL '30 days' THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by, venue_id) 
          VALUES (guest_id_param, tag_record.id, 'system', guest_record.venue_id);
        END IF;
      
      WHEN 'Lapsed' THEN
        IF stats_record.last_visit_date < CURRENT_DATE - INTERVAL '6 months' THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by, venue_id) 
          VALUES (guest_id_param, tag_record.id, 'system', guest_record.venue_id);
        END IF;
      
      WHEN 'Bulk Booker' THEN
        IF stats_record.bulk_booking_count > 0 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by, venue_id) 
          VALUES (guest_id_param, tag_record.id, 'system', guest_record.venue_id);
        END IF;
      
      WHEN 'Early Bird' THEN
        IF stats_record.early_bird_count >= 3 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by, venue_id) 
          VALUES (guest_id_param, tag_record.id, 'system', guest_record.venue_id);
        END IF;
      
      WHEN 'Last-Minute Booker' THEN
        IF stats_record.last_minute_count >= 3 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by, venue_id) 
          VALUES (guest_id_param, tag_record.id, 'system', guest_record.venue_id);
        END IF;
      
      WHEN 'No-Show Risk' THEN
        IF stats_record.no_show_count >= 2 AND stats_record.last_visit_date >= CURRENT_DATE - INTERVAL '6 months' THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by, venue_id) 
          VALUES (guest_id_param, tag_record.id, 'system', guest_record.venue_id);
        END IF;
    END CASE;
  END LOOP;
END;
$$;


-- ============================================
-- PART 5: Helper function for payment authorization
-- ============================================

CREATE OR REPLACE FUNCTION public.user_can_create_payment(
  _user_id UUID,
  _booking_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_venue_id UUID;
  user_venue_id UUID;
BEGIN
  -- Get booking's venue
  SELECT venue_id INTO booking_venue_id
  FROM public.bookings
  WHERE id = _booking_id;

  -- Get user's venue
  SELECT venue_id INTO user_venue_id
  FROM public.profiles
  WHERE id = _user_id;

  -- Allow if same venue (user is staff at that venue)
  RETURN booking_venue_id = user_venue_id AND booking_venue_id IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_can_create_payment(UUID, INTEGER) TO authenticated;


-- ============================================
-- PART 6: Deprecate profiles.role column
-- ============================================

COMMENT ON COLUMN public.profiles.role IS '⚠️ DEPRECATED: Display-only field. NEVER use for authorization checks. Use user_roles table + helper functions (is_admin, has_role) instead. This field exists only for backwards compatibility and UI display.';


-- ============================================
-- END OF MIGRATION
-- ============================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Security migration completed successfully';
  RAISE NOTICE '✅ Verification codes locked down';
  RAISE NOTICE '✅ Payment requests venue-scoped';
  RAISE NOTICE '✅ Guest access venue-scoped with privacy-safe RPC';
  RAISE NOTICE '✅ All 6 SECURITY DEFINER functions protected with search_path';
  RAISE NOTICE '✅ Payment authorization helper created';
  RAISE NOTICE '✅ profiles.role marked as deprecated';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update client code to use verify-code edge function';
  RAISE NOTICE '2. Update client code to use check_returning_guest RPC';
  RAISE NOTICE '3. Enable leaked password protection in Supabase dashboard';
  RAISE NOTICE '4. Monitor security_audit table for unusual activity';
END $$;