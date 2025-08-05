
-- Phase 1: Remove payment-related columns from services table
ALTER TABLE public.services 
DROP COLUMN IF EXISTS requires_payment,
DROP COLUMN IF EXISTS charge_type,
DROP COLUMN IF EXISTS charge_amount_per_guest,
DROP COLUMN IF EXISTS minimum_guests_for_charge;

-- Remove payment-related tables that are no longer needed
DROP TABLE IF EXISTS public.booking_payments CASCADE;
DROP TABLE IF EXISTS public.payment_analytics CASCADE;
DROP TABLE IF EXISTS public.venue_stripe_settings CASCADE;
DROP TABLE IF EXISTS public.payment_transactions CASCADE;

-- Remove payment-related functions
DROP FUNCTION IF EXISTS public.expire_pending_payments() CASCADE;

-- Update bookings table to remove payment-related statuses
-- Keep the status column but ensure no payment-related statuses remain
UPDATE public.bookings 
SET status = 'confirmed' 
WHERE status IN ('pending_payment', 'payment_failed');

-- Clean up any webhook events table if it exists
DROP TABLE IF EXISTS public.webhook_events CASCADE;

-- Remove any payment-related indexes that might exist
DROP INDEX IF EXISTS idx_booking_payments_booking_id;
DROP INDEX IF EXISTS idx_booking_payments_status;
DROP INDEX IF EXISTS idx_venue_stripe_settings_venue_id;
DROP INDEX IF EXISTS idx_payment_transactions_venue_id;
