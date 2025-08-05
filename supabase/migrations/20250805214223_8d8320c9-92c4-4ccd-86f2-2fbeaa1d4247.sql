
-- Phase 1: Database Schema Enhancement

-- 1. Enhance venue_stripe_settings table with encrypted secret key fields
ALTER TABLE venue_stripe_settings 
ADD COLUMN secret_key_test_encrypted text,
ADD COLUMN secret_key_live_encrypted text,
ADD COLUMN encryption_key_id text,
ADD COLUMN last_key_update_at timestamp with time zone DEFAULT now(),
ADD COLUMN key_validation_status jsonb DEFAULT '{"test": {"valid": false, "last_checked": null}, "live": {"valid": false, "last_checked": null}}'::jsonb;

-- 2. Complete refund implementation in booking_payments table
ALTER TABLE booking_payments
ADD COLUMN refund_amount_cents integer DEFAULT 0,
ADD COLUMN refund_status text DEFAULT 'none' CHECK (refund_status IN ('none', 'partial', 'full', 'processing', 'failed')),
ADD COLUMN refund_reason text,
ADD COLUMN refunded_at timestamp with time zone,
ADD COLUMN stripe_refund_id text;

-- 3. Create stripe_key_audit table for comprehensive key access logging
CREATE TABLE stripe_key_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('viewed', 'updated', 'created', 'validated', 'environment_switched', 'decrypted')),
  environment text NOT NULL CHECK (environment IN ('test', 'live', 'both')),
  key_type text NOT NULL CHECK (key_type IN ('secret', 'publishable', 'webhook')),
  ip_address inet,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on stripe_key_audit table
ALTER TABLE stripe_key_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stripe_key_audit
CREATE POLICY "Venue users can view their audit logs" 
  ON stripe_key_audit 
  FOR SELECT 
  USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "System can create audit logs" 
  ON stripe_key_audit 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Super admins can view all audit logs" 
  ON stripe_key_audit 
  FOR SELECT 
  USING (is_super_admin(auth.uid()));

-- Add indexes for performance
CREATE INDEX idx_stripe_key_audit_venue_id ON stripe_key_audit(venue_id);
CREATE INDEX idx_stripe_key_audit_user_id ON stripe_key_audit(user_id);
CREATE INDEX idx_stripe_key_audit_created_at ON stripe_key_audit(created_at);
CREATE INDEX idx_stripe_key_audit_action ON stripe_key_audit(action);

-- Add index for booking_payments refund queries
CREATE INDEX idx_booking_payments_refund_status ON booking_payments(refund_status) WHERE refund_status != 'none';
