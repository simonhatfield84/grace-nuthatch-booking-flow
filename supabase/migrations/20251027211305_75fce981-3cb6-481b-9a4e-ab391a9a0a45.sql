-- Remove default value from bookings.status that was overriding server-set status
ALTER TABLE bookings ALTER COLUMN status DROP DEFAULT;

-- Verify no default exists
COMMENT ON COLUMN bookings.status IS 'Booking status: confirmed, pending_payment, cancelled, seated, completed, no_show. No default - must be explicitly set by application logic.';
