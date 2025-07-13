-- Add pending_payment status to bookings
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('confirmed', 'cancelled', 'finished', 'no_show', 'pending_payment'));