
-- Add new fields to booking_audit table for enhanced tracking
ALTER TABLE public.booking_audit 
ADD COLUMN IF NOT EXISTS source_type text,
ADD COLUMN IF NOT EXISTS source_details jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS email_status text,
ADD COLUMN IF NOT EXISTS notification_details jsonb DEFAULT '{}';

-- Create index for performance on source_type queries
CREATE INDEX IF NOT EXISTS idx_booking_audit_source_type ON public.booking_audit(source_type);

-- Create index for performance on email_status queries  
CREATE INDEX IF NOT EXISTS idx_booking_audit_email_status ON public.booking_audit(email_status);

-- Add comments for documentation
COMMENT ON COLUMN public.booking_audit.source_type IS 'Source of the action: guest_via_widget, host_via_interface, system_automatic, etc.';
COMMENT ON COLUMN public.booking_audit.source_details IS 'Additional details about the source: IP address, user agent, interface type, etc.';
COMMENT ON COLUMN public.booking_audit.email_status IS 'Status of email notifications: sent, failed, pending, not_applicable';
COMMENT ON COLUMN public.booking_audit.notification_details IS 'Details about email/notification attempts including error messages';
