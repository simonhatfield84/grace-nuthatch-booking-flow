
-- Fix the generate_booking_token function to use supported base64 encoding
CREATE OR REPLACE FUNCTION public.generate_booking_token()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Use standard base64 encoding instead of base64url which is not supported
  -- Then replace characters to make it URL-safe
  RETURN replace(replace(encode(gen_random_bytes(32), 'base64'), '+', '-'), '/', '_');
END;
$function$
