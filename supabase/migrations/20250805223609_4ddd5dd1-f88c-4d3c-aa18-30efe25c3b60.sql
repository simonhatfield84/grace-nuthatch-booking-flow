
-- Add missing refund-related columns to the services table
ALTER TABLE public.services 
ADD COLUMN refund_window_hours INTEGER DEFAULT 24,
ADD COLUMN auto_refund_enabled BOOLEAN DEFAULT false;

-- Add comments for clarity
COMMENT ON COLUMN public.services.refund_window_hours IS 'Hours before booking start time when refunds are allowed';
COMMENT ON COLUMN public.services.auto_refund_enabled IS 'Whether refunds should be processed automatically within the refund window';
