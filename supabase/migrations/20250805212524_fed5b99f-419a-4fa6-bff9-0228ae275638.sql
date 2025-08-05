
-- Clear existing hardcoded data and update venue_stripe_settings table for multi-environment support
DELETE FROM venue_stripe_settings;

-- Add new columns for comprehensive Stripe configuration
ALTER TABLE venue_stripe_settings 
ADD COLUMN environment text DEFAULT 'test' CHECK (environment IN ('test', 'live')),
ADD COLUMN publishable_key_test text,
ADD COLUMN publishable_key_live text,
ADD COLUMN webhook_secret_test text,
ADD COLUMN webhook_secret_live text,
ADD COLUMN configuration_status jsonb DEFAULT '{"test": {"keys_configured": false, "webhook_configured": false}, "live": {"keys_configured": false, "webhook_configured": false}}';

-- Remove old columns that are no longer needed
ALTER TABLE venue_stripe_settings 
DROP COLUMN IF EXISTS stripe_account_id,
DROP COLUMN IF EXISTS webhook_endpoint_secret;

-- Add unique constraint for venue_id to ensure one record per venue
CREATE UNIQUE INDEX IF NOT EXISTS idx_venue_stripe_settings_venue_id ON venue_stripe_settings(venue_id);

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Venue admins can manage their stripe settings" ON venue_stripe_settings;
DROP POLICY IF EXISTS "Venue users can view their stripe settings" ON venue_stripe_settings;

CREATE POLICY "Venue admins can manage their stripe settings" ON venue_stripe_settings
FOR ALL USING (
  auth.uid() IS NOT NULL AND 
  venue_id = get_user_venue(auth.uid()) AND 
  is_admin(auth.uid(), venue_id)
);

CREATE POLICY "Venue users can view their stripe settings" ON venue_stripe_settings
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  venue_id = get_user_venue(auth.uid())
);
