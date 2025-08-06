
-- First, let's ensure the processed_at column exists in the booking_payments table
-- (This may already exist, but we need to confirm the column is properly defined)

DO $$ 
BEGIN 
    -- Check if processed_at column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'booking_payments' 
        AND column_name = 'processed_at'
    ) THEN
        ALTER TABLE public.booking_payments 
        ADD COLUMN processed_at timestamp with time zone;
    END IF;
END $$;
