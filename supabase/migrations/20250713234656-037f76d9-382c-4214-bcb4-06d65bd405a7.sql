-- Add pending_payment status to bookings if it doesn't exist
DO $$
BEGIN
    -- Check if we need to update the status column constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname LIKE '%bookings_status_check%' 
        AND consrc LIKE '%pending_payment%'
    ) THEN
        -- Drop existing constraint if it exists
        ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
        
        -- Add new constraint with pending_payment
        ALTER TABLE public.bookings 
        ADD CONSTRAINT bookings_status_check 
        CHECK (status IN ('confirmed', 'cancelled', 'finished', 'no_show', 'pending_payment'));
    END IF;
END $$;