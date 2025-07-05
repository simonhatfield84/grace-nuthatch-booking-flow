
-- Create a table to store email verification codes
CREATE TABLE public.email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
  used_at TIMESTAMP WITH TIME ZONE NULL,
  attempts INTEGER DEFAULT 0
);

-- Add RLS policies
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert codes (for signup)
CREATE POLICY "Anyone can create verification codes"
  ON public.email_verification_codes
  FOR INSERT
  WITH CHECK (true);

-- Policy to allow anyone to select codes for verification
CREATE POLICY "Anyone can verify codes"
  ON public.email_verification_codes
  FOR SELECT
  USING (true);

-- Policy to allow updating codes when they're used
CREATE POLICY "Anyone can update codes"
  ON public.email_verification_codes
  FOR UPDATE
  USING (true);

-- Function to generate a 6-digit verification code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$;

-- Function to create and send verification code
CREATE OR REPLACE FUNCTION create_verification_code(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- Generate new code
  new_code := generate_verification_code();
  
  -- Clean up old codes for this email
  DELETE FROM public.email_verification_codes 
  WHERE email = user_email AND expires_at < NOW();
  
  -- Insert new code
  INSERT INTO public.email_verification_codes (email, code)
  VALUES (user_email, new_code);
  
  RETURN new_code;
END;
$$;

-- Function to verify a code
CREATE OR REPLACE FUNCTION verify_code(user_email TEXT, submitted_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
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

-- Create a database function for atomic venue setup
CREATE OR REPLACE FUNCTION setup_venue_atomic(
  p_user_id UUID,
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_venue_name TEXT,
  p_venue_slug TEXT,
  p_venue_email TEXT,
  p_venue_phone TEXT,
  p_venue_address TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
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
$$;
