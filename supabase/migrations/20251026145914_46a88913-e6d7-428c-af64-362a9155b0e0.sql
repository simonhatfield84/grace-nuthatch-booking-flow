-- =====================================================
-- SECURITY FIX: RLS Policies for Sensitive Tables
-- =====================================================
-- Fix overly permissive policies that use USING (true)
-- without role restrictions, allowing any authenticated
-- user to access sensitive data.

-- =====================================================
-- 1. EMAIL VERIFICATION CODES
-- =====================================================
-- Drop overly permissive policy
DROP POLICY IF EXISTS "service_role_manages_verification_codes" ON public.email_verification_codes;

-- Create role-specific policy for service_role ONLY
CREATE POLICY "service_role_manages_verification_codes"
  ON public.email_verification_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure no other policies allow public access
-- (verified: no other policies exist on this table)

-- =====================================================
-- 2. PAYMENT REQUESTS
-- =====================================================
-- Drop overly permissive policy
DROP POLICY IF EXISTS "service_role_manages_payment_requests" ON public.payment_requests;

-- Create role-specific policy for service_role ONLY
CREATE POLICY "service_role_manages_payment_requests"
  ON public.payment_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Existing venue-scoped policies remain:
-- - "Venue users can view their payment requests" (SELECT)
-- - "venue_admins_view_payment_requests" (SELECT)
-- - "venue_staff_create_payment_requests" (INSERT)

-- Add audit log entry
INSERT INTO public.security_audit (
  event_type,
  event_details
) VALUES (
  'rls_policies_hardened',
  jsonb_build_object(
    'tables', ARRAY['email_verification_codes', 'payment_requests'],
    'fix_type', 'restricted_service_role_policies',
    'severity', 'CRITICAL',
    'timestamp', NOW(),
    'description', 'Fixed overly permissive USING (true) policies to be role-specific'
  )
);