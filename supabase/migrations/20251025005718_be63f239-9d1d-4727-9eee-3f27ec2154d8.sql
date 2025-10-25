-- Create booking_locks table for time slot holds (fixed)
begin;

-- Booking locks table
create table if not exists public.booking_locks (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  booking_date date not null,
  start_time time not null,
  party_size int not null check (party_size > 0),
  lock_token text not null unique,
  ip_hash text,
  ua_hash text,
  locked_at timestamptz not null default now(),
  expires_at timestamptz not null,
  released_at timestamptz,
  reason text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for cleanup queries
create index if not exists booking_locks_expires_idx 
  on public.booking_locks(expires_at) 
  where released_at is null;

-- Index for venue/service queries
create index if not exists booking_locks_venue_service_idx
  on public.booking_locks(venue_id, service_id, booking_date);

-- RLS: Service role only
alter table public.booking_locks enable row level security;

create policy "Service role can manage booking locks"
  on public.booking_locks
  for all
  using (auth.jwt()->>'role' = 'service_role');

-- Create function to check for active locks (immutable context)
create or replace function has_active_lock(
  p_venue_id uuid,
  p_service_id uuid,
  p_booking_date date,
  p_start_time time,
  check_time timestamptz default now()
) returns boolean as $$
  select exists (
    select 1 from public.booking_locks
    where venue_id = p_venue_id
      and service_id = p_service_id
      and booking_date = p_booking_date
      and start_time = p_start_time
      and released_at is null
      and expires_at > check_time
  );
$$ language sql stable;

-- Comments
comment on table public.booking_locks is 
  'Temporary holds on booking time slots to prevent double-bookings during checkout';
comment on column public.booking_locks.lock_token is 
  'Unique token provided to client for lock validation and extension';
comment on column public.booking_locks.expires_at is 
  'Timestamp when lock expires (5 minutes from locked_at by default)';
comment on column public.booking_locks.reason is 
  'Why lock was created/released: created, extended, released, expired, paid, cancelled';

commit;