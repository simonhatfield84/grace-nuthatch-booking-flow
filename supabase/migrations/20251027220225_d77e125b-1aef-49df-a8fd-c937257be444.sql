-- ============= SERVICE-VENUE HARDENING MIGRATION =============
-- Purpose: Prevent invalid venue_id values in services table
-- Creates: backup table, CHECK constraint, BEFORE INSERT trigger

-- 1. Create backup table (idempotent with timestamp suffix)
DO $$
DECLARE
  backup_name text;
  counter int := 2;
BEGIN
  backup_name := 'services_backup_utc_now';
  
  WHILE EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = backup_name
  ) LOOP
    backup_name := 'services_backup_utc_now_' || counter;
    counter := counter + 1;
  END LOOP;
  
  EXECUTE format(
    'CREATE TABLE %I AS 
     SELECT *, now() as backed_up_at_utc 
     FROM services',
    backup_name
  );
  
  RAISE NOTICE '✅ Backup created: %', backup_name;
END $$;

-- 2. Add CHECK constraint to prevent self-reference
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'services_venue_id_not_self'
  ) THEN
    ALTER TABLE services
      ADD CONSTRAINT services_venue_id_not_self
      CHECK (venue_id != id);
    RAISE NOTICE '✅ CHECK constraint added: services_venue_id_not_self';
  ELSE
    RAISE NOTICE '⚠️  CHECK constraint already exists: services_venue_id_not_self';
  END IF;
END $$;

-- 3. Add BEFORE INSERT trigger to enforce valid venue_id
CREATE OR REPLACE FUNCTION enforce_valid_venue_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Guard 1: NULL check
  IF NEW.venue_id IS NULL THEN
    RAISE EXCEPTION 'venue_id_null'
      USING HINT = 'venue_id cannot be NULL when creating a service';
  END IF;
  
  -- Guard 2: Must exist in venues table
  IF NOT EXISTS (SELECT 1 FROM venues WHERE id = NEW.venue_id) THEN
    RAISE EXCEPTION 'venue_id_invalid'
      USING HINT = format('venue_id %s does not exist in venues table', NEW.venue_id);
  END IF;
  
  -- Guard 3: Cannot self-reference (redundant with CHECK but explicit)
  IF NEW.venue_id = NEW.id THEN
    RAISE EXCEPTION 'venue_id_self_reference'
      USING HINT = 'venue_id cannot equal service id (self-reference blocked)';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_valid_venue_id ON services;

CREATE TRIGGER trg_enforce_valid_venue_id
  BEFORE INSERT ON services
  FOR EACH ROW
  EXECUTE FUNCTION enforce_valid_venue_id();

-- Log trigger creation
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger created: trg_enforce_valid_venue_id';
END $$;

-- 4. Verification audit
DO $$
DECLARE
  total int;
  null_count int;
  self_ref int;
  invalid int;
BEGIN
  SELECT 
    COUNT(*),
    SUM(CASE WHEN venue_id IS NULL THEN 1 ELSE 0 END),
    SUM(CASE WHEN venue_id = id THEN 1 ELSE 0 END),
    SUM(CASE WHEN NOT EXISTS (
      SELECT 1 FROM venues WHERE venues.id = services.venue_id
    ) THEN 1 ELSE 0 END)
  INTO total, null_count, self_ref, invalid
  FROM services;
  
  RAISE NOTICE '=== Service→Venue Link Audit ===';
  RAISE NOTICE 'Total services: %', total;
  RAISE NOTICE 'NULL venue_id: %', COALESCE(null_count, 0);
  RAISE NOTICE 'Self-references: %', COALESCE(self_ref, 0);
  RAISE NOTICE 'Invalid venue_id: %', COALESCE(invalid, 0);
  
  IF COALESCE(null_count, 0) = 0 AND COALESCE(self_ref, 0) = 0 AND COALESCE(invalid, 0) = 0 THEN
    RAISE NOTICE '✅ All services have valid venue_id';
  ELSE
    RAISE WARNING '❌ Data quality issues detected';
  END IF;
END $$;