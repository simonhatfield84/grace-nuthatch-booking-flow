-- Add missing columns to webhook_events table for stripe-webhook-secure
ALTER TABLE webhook_events
ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'processed',
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Create index on venue_id for filtering
CREATE INDEX IF NOT EXISTS idx_webhook_events_venue_id ON webhook_events(venue_id);

-- Create index on processed_at for sorting
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON webhook_events(processed_at DESC);