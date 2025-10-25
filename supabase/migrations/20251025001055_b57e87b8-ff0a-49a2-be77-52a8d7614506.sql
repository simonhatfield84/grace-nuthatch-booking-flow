-- ============================================
-- Migration: Add Foreign Key to booking_windows
-- Purpose: Fix "No tables available" bug by enabling nested queries
-- Date: 2025-01-24
-- ============================================

-- Step 1: Clean up orphaned booking windows
DELETE FROM booking_windows 
WHERE id IN (
  '4e078261-2d6f-4720-be8c-56d72d52b714',
  'e104c049-384d-4f4d-bea4-367e651266c2'
);

-- Step 2: Clear stale availability cache
DELETE FROM availability_cache;

-- Step 3: Add foreign key constraint
ALTER TABLE booking_windows
ADD CONSTRAINT booking_windows_service_id_fkey
FOREIGN KEY (service_id)
REFERENCES services(id)
ON DELETE CASCADE;

-- Step 4: Add NOT NULL constraint
ALTER TABLE booking_windows
ALTER COLUMN service_id SET NOT NULL;

-- Step 5: Verify the constraint was created
DO $$
DECLARE
  fk_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'booking_windows_service_id_fkey'
    AND table_name = 'booking_windows'
  ) INTO fk_exists;
  
  IF NOT fk_exists THEN
    RAISE EXCEPTION 'Foreign key constraint was not created successfully';
  END IF;
END $$;