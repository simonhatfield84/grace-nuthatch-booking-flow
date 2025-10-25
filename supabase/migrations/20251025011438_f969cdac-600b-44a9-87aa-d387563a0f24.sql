-- Comprehensive migration: Add overlap prevention with automatic conflict resolution

BEGIN;

-- Step 1: Enable extension
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Step 2: Create immutable function for time range computation
CREATE OR REPLACE FUNCTION compute_booking_time_range(
  p_date date,
  p_time time,
  p_duration_minutes integer
) RETURNS tstzrange
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT tstzrange(
    (p_date + p_time)::timestamptz,
    (p_date + p_time + (COALESCE(p_duration_minutes, 120) * interval '1 minute'))::timestamptz,
    '[)'
  );
$$;

-- Step 3: Add time_range column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'time_range'
  ) THEN
    ALTER TABLE public.bookings
      ADD COLUMN time_range tstzrange
      GENERATED ALWAYS AS (
        compute_booking_time_range(booking_date, booking_time, duration_minutes)
      ) STORED;
  END IF;
END $$;

-- Step 4: Identify and auto-resolve conflicts
-- Mark newer bookings in conflicting pairs as 'finished'
WITH conflicts AS (
  SELECT b2.id
  FROM bookings b1
  JOIN bookings b2 ON 
    b1.table_id = b2.table_id
    AND b1.booking_date = b2.booking_date
    AND b1.id < b2.id
    AND b1.status IN ('pending', 'confirmed', 'seated')
    AND b2.status IN ('pending', 'confirmed', 'seated')
  WHERE b1.time_range && b2.time_range
)
UPDATE bookings
SET status = 'finished',
    notes = COALESCE(notes || ' | ', '') || 'Overlap conflict auto-resolved - admin review'
WHERE id IN (SELECT id FROM conflicts);

-- Step 5: Add exclusion constraint
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_no_overlap_per_table;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_overlap_per_table
  EXCLUDE USING gist (
    table_id WITH =,
    time_range WITH &&
  )
  WHERE (
    table_id IS NOT NULL
    AND status IN ('pending', 'confirmed', 'seated')
  );

-- Step 6: Add performance index
CREATE INDEX IF NOT EXISTS bookings_active_time_range_idx
  ON public.bookings USING gist (table_id, time_range)
  WHERE status IN ('pending', 'confirmed', 'seated');

-- Step 7: Create overlap review view
CREATE OR REPLACE VIEW booking_overlaps_review AS
SELECT 
  b1.id as booking_1_id,
  b1.guest_name as guest_1,
  b1.booking_time as time_1,
  b1.end_time as end_1,
  b2.id as booking_2_id,
  b2.guest_name as guest_2,
  b2.booking_time as time_2,
  b2.end_time as end_2,
  b1.table_id,
  b1.booking_date,
  b1.status as status_1,
  b2.status as status_2
FROM bookings b1
JOIN bookings b2 ON 
  b1.table_id = b2.table_id
  AND b1.booking_date = b2.booking_date
  AND b1.id < b2.id
WHERE b1.time_range && b2.time_range;

COMMENT ON CONSTRAINT bookings_no_overlap_per_table ON public.bookings IS 
  'DB-level overlap prevention for active bookings per table. Previous conflicts were auto-resolved.';

COMMENT ON VIEW booking_overlaps_review IS 
  'View to monitor all booking overlaps (including historical). Check this view after major booking imports.';

COMMIT;
