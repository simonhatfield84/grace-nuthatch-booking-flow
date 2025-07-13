-- Fix Function Search Path Security - Add SET search_path = '' to all functions
-- This prevents SQL injection through search path manipulation

-- Update generate_booking_reference function
CREATE OR REPLACE FUNCTION public.generate_booking_reference()
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  ref_number INTEGER;
  year_part TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Get the next sequential number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(booking_reference FROM '\d+$') AS INTEGER)), 0) + 1
  INTO ref_number
  FROM public.bookings 
  WHERE booking_reference LIKE 'BK-' || year_part || '-%';
  
  RETURN 'BK-' || year_part || '-' || LPAD(ref_number::TEXT, 6, '0');
END;
$function$;

-- Update set_booking_reference function
CREATE OR REPLACE FUNCTION public.set_booking_reference()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  IF NEW.booking_reference IS NULL THEN
    NEW.booking_reference := public.generate_booking_reference();
  END IF;
  RETURN NEW;
END;
$function$;

-- Update generate_verification_code function
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$function$;

-- Update create_verification_code function
CREATE OR REPLACE FUNCTION public.create_verification_code(user_email text)
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $function$
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
$function$;

-- Update verify_code function
CREATE OR REPLACE FUNCTION public.verify_code(user_email text, submitted_code text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = ''
AS $function$
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
$function$;

-- Update calculate_guest_stats function
CREATE OR REPLACE FUNCTION public.calculate_guest_stats(guest_email text, guest_phone text)
RETURNS TABLE(visit_count integer, last_visit_date date, no_show_count integer, early_bird_count integer, last_minute_count integer, bulk_booking_count integer)
LANGUAGE plpgsql
SET search_path = ''
AS $function$
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
$function$;

-- Update assign_automatic_tags function
CREATE OR REPLACE FUNCTION public.assign_automatic_tags(guest_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $function$
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
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Repeat' THEN
        IF stats_record.visit_count BETWEEN 2 AND 4 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Frequent' THEN
        IF stats_record.visit_count >= 5 AND stats_record.last_visit_date >= CURRENT_DATE - INTERVAL '6 months' THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Recent' THEN
        IF stats_record.last_visit_date >= CURRENT_DATE - INTERVAL '30 days' THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Lapsed' THEN
        IF stats_record.last_visit_date < CURRENT_DATE - INTERVAL '6 months' THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Bulk Booker' THEN
        IF stats_record.bulk_booking_count > 0 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Early Bird' THEN
        IF stats_record.early_bird_count >= 3 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Last-Minute Booker' THEN
        IF stats_record.last_minute_count >= 3 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'No-Show Risk' THEN
        IF stats_record.no_show_count >= 2 AND stats_record.last_visit_date >= CURRENT_DATE - INTERVAL '6 months' THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
    END CASE;
  END LOOP;
END;
$function$;

-- Update setup_venue_atomic function
CREATE OR REPLACE FUNCTION public.setup_venue_atomic(p_user_id uuid, p_email text, p_first_name text, p_last_name text, p_venue_name text, p_venue_slug text, p_venue_email text, p_venue_phone text, p_venue_address text)
RETURNS json
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  venue_record RECORD;
  result JSON;
BEGIN
  -- Start transaction
  BEGIN
    -- Create venue
    INSERT INTO public.venues (name, slug, email, phone, address, approval_status)
    VALUES (p_venue_name, p_venue_slug, p_venue_email, p_venue_phone, p_venue_address, 'pending')
    RETURNING * INTO venue_record;
    
    -- Create/Update profile
    INSERT INTO public.profiles (
      id, venue_id, email, first_name, last_name, role, is_active
    ) VALUES (
      p_user_id, venue_record.id, p_email, p_first_name, p_last_name, 'owner', true
    )
    ON CONFLICT (id) DO UPDATE SET
      venue_id = venue_record.id,
      first_name = p_first_name,
      last_name = p_last_name,
      role = 'owner',
      is_active = true;
    
    -- Create user role
    INSERT INTO public.user_roles (user_id, venue_id, role)
    VALUES (p_user_id, venue_record.id, 'owner')
    ON CONFLICT (user_id, venue_id, role) DO NOTHING;
    
    -- Return success with venue data
    result := json_build_object(
      'success', true,
      'venue', row_to_json(venue_record)
    );
    
    RETURN result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Return error details
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    
    RETURN result;
  END;
END;
$function$;

-- Update find_duplicate_guests function
CREATE OR REPLACE FUNCTION public.find_duplicate_guests(guest_email text DEFAULT NULL::text, guest_phone text DEFAULT NULL::text)
RETURNS TABLE(id uuid, name text, email text, phone text, created_at timestamp with time zone, match_type text)
LANGUAGE plpgsql
SET search_path = ''
AS $function$
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
$function$;

-- Update merge_guests function
CREATE OR REPLACE FUNCTION public.merge_guests(primary_guest_id uuid, duplicate_guest_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = ''
AS $function$
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
$function$;

-- Update generate_webhook_secret function
CREATE OR REPLACE FUNCTION public.generate_webhook_secret()
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  RETURN 'whsec_' || encode(gen_random_bytes(32), 'base64');
END;
$function$;

-- Update update_user_role function
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role public.app_role, target_venue_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  caller_is_admin BOOLEAN;
  caller_current_role public.app_role;
  target_current_role public.app_role;
  caller_user_id UUID;
BEGIN
  -- Get caller's user ID
  caller_user_id := auth.uid();
  
  -- Prevent self-role elevation
  IF caller_user_id = target_user_id THEN
    INSERT INTO public.security_audit (
      user_id, venue_id, event_type, event_details
    ) VALUES (
      caller_user_id, target_venue_id, 'role_change_attempt_blocked',
      jsonb_build_object(
        'reason', 'self_elevation_attempt',
        'target_role', new_role,
        'blocked_at', NOW()
      )
    );
    RAISE EXCEPTION 'Users cannot modify their own roles for security reasons';
  END IF;
  
  -- Check if caller is admin of the target venue
  SELECT public.is_admin(caller_user_id, target_venue_id) INTO caller_is_admin;
  
  IF NOT caller_is_admin THEN
    INSERT INTO public.security_audit (
      user_id, venue_id, event_type, event_details
    ) VALUES (
      caller_user_id, target_venue_id, 'unauthorized_role_change_attempt',
      jsonb_build_object(
        'target_user_id', target_user_id,
        'attempted_role', new_role,
        'blocked_at', NOW()
      )
    );
    RAISE EXCEPTION 'Insufficient permissions to modify user roles';
  END IF;
  
  -- Get current roles for logging
  SELECT ur.role INTO caller_current_role 
  FROM public.user_roles ur 
  WHERE ur.user_id = caller_user_id AND ur.venue_id = target_venue_id;
  
  SELECT ur.role INTO target_current_role 
  FROM public.user_roles ur 
  WHERE ur.user_id = target_user_id AND ur.venue_id = target_venue_id;
  
  -- Prevent owners from being demoted by managers
  IF target_current_role = 'owner' AND caller_current_role != 'owner' THEN
    INSERT INTO public.security_audit (
      user_id, venue_id, event_type, event_details
    ) VALUES (
      caller_user_id, target_venue_id, 'owner_demotion_attempt_blocked',
      jsonb_build_object(
        'target_user_id', target_user_id,
        'attempted_by_role', caller_current_role,
        'blocked_at', NOW()
      )
    );
    RAISE EXCEPTION 'Only owners can modify owner roles';
  END IF;
  
  -- Update the user role
  UPDATE public.user_roles 
  SET role = new_role, assigned_by = caller_user_id, assigned_at = NOW()
  WHERE user_id = target_user_id AND venue_id = target_venue_id;
  
  -- Update profile role as well
  UPDATE public.profiles 
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id AND venue_id = target_venue_id;
  
  -- Log successful role change
  INSERT INTO public.security_audit (
    user_id, venue_id, event_type, event_details
  ) VALUES (
    caller_user_id, target_venue_id, 'role_change_successful',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'old_role', target_current_role,
      'new_role', new_role,
      'changed_by_role', caller_current_role,
      'changed_at', NOW()
    )
  );
  
  -- Also log in booking_audit for backwards compatibility
  INSERT INTO public.booking_audit (
    booking_id, venue_id, changed_by, change_type, 
    field_name, old_value, new_value, notes
  ) VALUES (
    0, target_venue_id, caller_user_id::text, 'role_change',
    'user_role', target_current_role::text, new_role::text, 
    'Role updated for user: ' || target_user_id::text
  );
  
  RETURN TRUE;
END;
$function$;

-- Update prevent_unauthorized_role_updates function
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Allow system functions and setup processes
  IF current_setting('role') = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Prevent users from directly updating their role via profiles table
  IF OLD.role != NEW.role AND OLD.id = auth.uid() THEN
    INSERT INTO public.security_audit (
      user_id, venue_id, event_type, event_details
    ) VALUES (
      auth.uid(), NEW.venue_id, 'direct_role_update_blocked',
      jsonb_build_object(
        'attempted_old_role', OLD.role,
        'attempted_new_role', NEW.role,
        'blocked_at', NOW()
      )
    );
    RAISE EXCEPTION 'Direct role updates are not allowed. Use proper role management functions.';
  END IF;
  
  -- Allow authorized role updates (via the secure function)
  RETURN NEW;
END;
$function$;

-- Update detect_role_anomalies function
CREATE OR REPLACE FUNCTION public.detect_role_anomalies()
RETURNS TABLE(user_id uuid, venue_id uuid, suspicious_activity text, event_count integer, last_event timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    sa.user_id,
    sa.venue_id,
    sa.event_type as suspicious_activity,
    COUNT(*)::INTEGER as event_count,
    MAX(sa.created_at) as last_event
  FROM public.security_audit sa
  WHERE sa.event_type IN (
    'unauthorized_role_change_attempt',
    'self_elevation_attempt', 
    'owner_demotion_attempt_blocked',
    'direct_role_update_blocked'
  )
  AND sa.created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY sa.user_id, sa.venue_id, sa.event_type
  HAVING COUNT(*) >= 3  -- Flag users with 3+ suspicious attempts
  ORDER BY event_count DESC, last_event DESC;
END;
$function$;

-- Update has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _venue_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.venue_id = _venue_id
      AND ur.role = _role
      AND p.is_active = true
  )
$function$;

-- Update get_user_venue function
CREATE OR REPLACE FUNCTION public.get_user_venue(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT venue_id
  FROM public.profiles
  WHERE id = _user_id
    AND is_active = true
$function$;

-- Update is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid, _venue_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.venue_id = _venue_id
      AND ur.role IN ('owner', 'manager')
      AND p.is_active = true
  )
$function$;

-- Update setup_complete function
CREATE OR REPLACE FUNCTION public.setup_complete()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'owner'
  )
$function$;

-- Update is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admins
    WHERE user_id = _user_id
      AND is_active = true
  )
$function$;

-- Update get_tag_usage_count function
CREATE OR REPLACE FUNCTION public.get_tag_usage_count(tag_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = ''
AS $function$
  SELECT COUNT(*)::INTEGER FROM public.service_tags WHERE tag_id = $1;
$function$;

-- Update handle_table_deletion function
CREATE OR REPLACE FUNCTION public.handle_table_deletion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  -- Check if there are future bookings for this table
  IF EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE table_id = OLD.id 
    AND booking_date >= CURRENT_DATE 
    AND status NOT IN ('cancelled', 'finished')
  ) THEN
    -- Mark bookings as unallocated instead of deleting the table
    UPDATE public.bookings 
    SET is_unallocated = true, 
        original_table_id = table_id,
        table_id = NULL,
        updated_at = now()
    WHERE table_id = OLD.id 
    AND booking_date >= CURRENT_DATE 
    AND status NOT IN ('cancelled', 'finished');
    
    -- Soft delete the table instead of hard delete
    UPDATE public.tables 
    SET status = 'deleted', 
        deleted_at = now(),
        updated_at = now()
    WHERE id = OLD.id;
    
    -- Prevent the actual DELETE
    RETURN NULL;
  END IF;
  
  -- Allow normal deletion if no future bookings
  RETURN OLD;
END;
$function$;