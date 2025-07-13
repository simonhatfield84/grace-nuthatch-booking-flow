-- First, update any invalid status values to 'confirmed'
UPDATE public.bookings 
SET status = 'confirmed' 
WHERE status NOT IN ('confirmed', 'cancelled', 'finished', 'no_show');

-- Now add the constraint with pending_payment
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('confirmed', 'cancelled', 'finished', 'no_show', 'pending_payment'));