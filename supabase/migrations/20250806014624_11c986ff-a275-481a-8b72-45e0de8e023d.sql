
-- Clear all booking-related data for fresh testing
-- This will remove all bookings regardless of status (confirmed, cancelled, seated, etc.)

-- Start with dependent tables first to avoid foreign key constraint issues

-- Clear booking payments (contains payment history)
DELETE FROM public.booking_payments;

-- Clear booking audit trail (contains change history)
DELETE FROM public.booking_audit;

-- Clear booking tokens (contains modification/cancellation links)  
DELETE FROM public.booking_tokens;

-- Clear payment requests (if any exist)
DELETE FROM public.payment_requests;

-- Clear reminder logs (if any exist)
DELETE FROM public.reminder_log;

-- Finally, clear all bookings (main table)
DELETE FROM public.bookings;

-- Reset the booking ID sequence to start fresh at 1
ALTER SEQUENCE bookings_id_seq RESTART WITH 1;

-- Add a comment to track when this cleanup was done
INSERT INTO public.booking_audit (
    booking_id, 
    change_type, 
    changed_by, 
    changed_at, 
    notes,
    venue_id
) VALUES (
    0,
    'system_cleanup', 
    'Database Reset', 
    NOW(), 
    'All bookings cleared for fresh testing - ' || NOW()::date,
    (SELECT id FROM public.venues LIMIT 1)
);
