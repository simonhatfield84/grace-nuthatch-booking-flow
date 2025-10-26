-- Database Schema Snapshot - 2025-10-26
-- This file documents the database state before implementing refactoring guardrails

-- Note: This is a placeholder for the full schema export
-- To generate the complete schema, run:
-- pg_dump --schema-only --schema=public -h [host] -U [user] [database] > db-20251026.sql

-- Key Tables Referenced in Guardrails:
-- - bookings: Core booking data
-- - booking_locks: Time slot locks
-- - booking_audit: Change tracking
-- - availability_cache: Performance optimization
-- - availability_logs: Analytics and rate limiting
-- - services: Service definitions
-- - tables: Table/seating inventory
-- - venues: Venue configuration
-- - venue_stripe_settings: Payment configuration
-- - refactor_runs: NEW - Test run tracking (added 2025-10-26)

-- Key Functions:
-- - is_super_admin(user_id UUID)
-- - is_admin(user_id UUID, venue_id UUID)
-- - get_user_venue(user_id UUID)

-- Key Constraints:
-- - reservations_no_overlap_per_table: Prevents double bookings
-- - bookings_end_time_check: Validates booking duration

-- RLS Policies:
-- All tables have Row Level Security enabled
-- Platform admins have elevated privileges
-- Venue admins can manage their venue data
-- Public endpoints have specific anonymous access policies
