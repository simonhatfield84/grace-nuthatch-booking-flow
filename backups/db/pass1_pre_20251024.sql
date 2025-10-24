-- =====================================================
-- Tenancy Hardening Pass 1 - Pre-Migration Backup
-- Date: 2025-10-24
-- Branch: hardening/pass1-venue-id-20251024
-- =====================================================

-- Current State Inventory
-- ======================

-- booking_payments: 27 rows
-- All have valid booking_id references
-- No orphaned records

-- booking_tokens: 35 rows  
-- All have valid booking_id references
-- No orphaned records

-- service_tags: 0 rows
-- Empty table (feature not yet used)

-- guest_tags: 0 rows
-- Empty table (feature not yet used)

-- Schema Backup for Tables Being Modified
-- ========================================

-- booking_payments schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'booking_payments'
ORDER BY ordinal_position;

-- booking_tokens schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'booking_tokens'
ORDER BY ordinal_position;

-- service_tags schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'service_tags'
ORDER BY ordinal_position;

-- guest_tags schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'guest_tags'
ORDER BY ordinal_position;

-- Data Backup Queries
-- ===================

-- booking_payments data
\copy (SELECT * FROM public.booking_payments) TO '/tmp/booking_payments_backup_20251024.csv' CSV HEADER;

-- booking_tokens data
\copy (SELECT * FROM public.booking_tokens) TO '/tmp/booking_tokens_backup_20251024.csv' CSV HEADER;

-- service_tags data (empty)
\copy (SELECT * FROM public.service_tags) TO '/tmp/service_tags_backup_20251024.csv' CSV HEADER;

-- guest_tags data (empty)
\copy (SELECT * FROM public.guest_tags) TO '/tmp/guest_tags_backup_20251024.csv' CSV HEADER;

-- Parent Table Reference Integrity Check
-- =======================================

-- Verify all booking_payments have valid booking_id
SELECT 
  bp.id,
  bp.booking_id,
  b.venue_id as expected_venue_id
FROM public.booking_payments bp
LEFT JOIN public.bookings b ON b.id = bp.booking_id
WHERE b.id IS NULL;
-- Expected: 0 rows (all have valid references)

-- Verify all booking_tokens have valid booking_id
SELECT 
  bt.id,
  bt.booking_id,
  b.venue_id as expected_venue_id
FROM public.booking_tokens bt
LEFT JOIN public.bookings b ON b.id = bt.booking_id
WHERE b.id IS NULL;
-- Expected: 0 rows (all have valid references)

-- Verify all service_tags have valid service_id
SELECT 
  st.id,
  st.service_id,
  s.venue_id as expected_venue_id
FROM public.service_tags st
LEFT JOIN public.services s ON s.id = st.service_id
WHERE s.id IS NULL;
-- Expected: 0 rows (table is empty)

-- Verify all guest_tags have valid guest_id
SELECT 
  gt.id,
  gt.guest_id,
  g.venue_id as expected_venue_id
FROM public.guest_tags gt
LEFT JOIN public.guests g ON g.id = gt.guest_id
WHERE g.id IS NULL;
-- Expected: 0 rows (table is empty)

-- RLS Policies Before Migration
-- ==============================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('booking_payments', 'booking_tokens', 'service_tags', 'guest_tags')
ORDER BY tablename, policyname;

-- End of Pre-Migration Backup
-- ============================
