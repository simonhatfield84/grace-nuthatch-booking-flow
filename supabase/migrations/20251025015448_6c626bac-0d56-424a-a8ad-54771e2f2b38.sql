-- Admin Monitoring Tools: RPCs and RBAC helpers

-- Helper: Check if user is platform admin
create or replace function is_platform_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public as $$
  select exists (
    select 1
    from platform_admins
    where user_id = _user_id
      and is_active = true
  );
$$;

comment on function is_platform_admin is 
  'Checks if a user has active platform admin privileges';

-- Helper: Check if user can manage venue (venue admin/owner)
create or replace function user_can_manage_venue(_user_id uuid, _venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public as $$
  select exists (
    select 1
    from profiles p
    where p.id = _user_id
      and p.venue_id = _venue_id
      and p.role in ('owner', 'manager')
      and p.is_active = true
  );
$$;

comment on function user_can_manage_venue is 
  'Checks if a user can manage a specific venue (owner/manager role)';

-- RPC: List active booking holds with enriched data
create or replace function admin_list_active_holds(_venue_id uuid default null)
returns table (
  id uuid,
  venue_id uuid,
  venue_slug text,
  service_id uuid,
  service_title text,
  booking_date date,
  start_time time,
  party_size int,
  locked_at timestamptz,
  expires_at timestamptz,
  remaining_seconds int,
  lock_token text
)
language sql
security definer
set search_path = public as $$
  select 
    bl.id,
    bl.venue_id,
    v.slug as venue_slug,
    bl.service_id,
    s.title as service_title,
    bl.booking_date,
    bl.start_time,
    bl.party_size,
    bl.locked_at,
    bl.expires_at,
    greatest(0, extract(epoch from (bl.expires_at - now()))::int) as remaining_seconds,
    bl.lock_token
  from booking_locks bl
  join venues v on v.id = bl.venue_id
  join services s on s.id = bl.service_id
  where bl.released_at is null
    and bl.expires_at > now()
    and (_venue_id is null or bl.venue_id = _venue_id)
  order by bl.expires_at asc;
$$;

revoke all on function admin_list_active_holds(uuid) from public;
grant execute on function admin_list_active_holds(uuid) to authenticated;

comment on function admin_list_active_holds is 
  'Lists all active (unreleased, non-expired) booking locks with venue/service details. Platform admins see all venues; venue admins filtered by _venue_id.';

-- RPC: List availability logs with filtering
create or replace function admin_list_availability_logs(
  _venue_id uuid default null,
  _since timestamptz default now() - interval '3 days',
  _limit int default 2000
)
returns table (
  id uuid,
  venue_id uuid,
  venue_slug text,
  service_id uuid,
  date date,
  time_slot time,
  party_size int,
  action text,
  status text,
  result_slots int,
  took_ms int,
  cached boolean,
  occurred_at timestamptz,
  error_text text
)
language sql
security definer
set search_path = public as $$
  select 
    al.id,
    al.venue_id,
    al.venue_slug,
    al.service_id,
    al.date,
    al.time as time_slot,
    al.party_size,
    al.action,
    al.status,
    al.result_slots,
    al.took_ms,
    al.cached,
    al.occurred_at,
    al.error_text
  from availability_logs al
  where al.occurred_at >= _since
    and (_venue_id is null or al.venue_id = _venue_id)
  order by al.occurred_at desc
  limit _limit;
$$;

revoke all on function admin_list_availability_logs(uuid, timestamptz, int) from public;
grant execute on function admin_list_availability_logs(uuid, timestamptz, int) to authenticated;

comment on function admin_list_availability_logs is 
  'Returns availability logs for monitoring. Filters by venue (optional) and time window (default: last 3 days, max 2000 rows).';