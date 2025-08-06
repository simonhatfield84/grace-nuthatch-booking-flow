
-- Add refund settings to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS refund_window_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS auto_refund_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS refund_policy_text TEXT DEFAULT 'Standard 24-hour cancellation policy applies';

-- Update existing services with default values if they don't have them
UPDATE public.services 
SET refund_window_hours = 24, 
    auto_refund_enabled = false, 
    refund_policy_text = 'Standard 24-hour cancellation policy applies'
WHERE refund_window_hours IS NULL OR auto_refund_enabled IS NULL;

-- Create index for performance on refund eligibility queries
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON public.bookings(booking_date, booking_time);

-- Add a comment to track this enhancement
INSERT INTO public.booking_audit (
    booking_id, 
    change_type, 
    changed_by, 
    changed_at, 
    notes,
    venue_id
) VALUES (
    0,
    'system_enhancement', 
    'Refund Workflow Implementation', 
    NOW(), 
    'Added refund settings to services table for enhanced cancellation workflow',
    (SELECT id FROM public.venues LIMIT 1)
);
