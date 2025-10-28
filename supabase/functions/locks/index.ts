// @locked
// IMPORTANT: This file is protected during the refactor guard-rails phase.
// Do not rewrite or remove public interfaces without updating /src/lib/contracts.ts and smoke tests.
// Last validated: 2025-10-26
// Contract version: v1
// Related tests: tests/smoke/02-locks-flow.spec.ts

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { createErrorResponse, corsHeaders } from '../_shared/errorSanitizer.ts';
import { initSentry, withSentry } from '../_shared/sentry.ts';

// Initialize Sentry
initSentry();

const LOCK_HOLD_MINUTES = 5;

interface CreateLockRequest {
  venueSlug: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  partySize: number;
  clientFingerprint?: string;
}

interface ExtendLockRequest {
  lockToken: string;
}

interface ReleaseLockRequest {
  lockToken?: string;
  lockId?: string;
  reason?: string;
}

// Helper: Hash client identifier
async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: Invalidate availability cache
async function invalidateAvailabilityCache(
  supabase: any,
  venueId: string,
  serviceId: string,
  date: string
) {
  const { error } = await supabase
    .from('availability_cache')
    .delete()
    .eq('venue_id', venueId)
    .eq('service_id', serviceId)
    .eq('date', date);
  
  if (error) {
    console.error('❌ Cache invalidation failed:', error);
  } else {
    console.log('✅ Invalidated availability cache for', { venueId, serviceId, date });
  }
}

// Endpoint: POST /locks/create
async function handleCreateLock(supabase: any, req: Request): Promise<Response> {
  const { venueSlug, serviceId, date, time, partySize, clientFingerprint }: CreateLockRequest = 
    await req.json();

  console.log('🔒 Creating lock for:', { venueSlug, serviceId, date, time, partySize });

  // Validation
  if (!venueSlug || !serviceId || !date || !time || !partySize) {
    return new Response(JSON.stringify({
      ok: false,
      code: 'invalid_request',
      message: 'Missing required fields'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Resolve venue_id
  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .select('id')
    .eq('slug', venueSlug)
    .single();

  if (venueError || !venue) {
    return new Response(JSON.stringify({
      ok: false,
      code: 'venue_not_found',
      message: 'Venue not found'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const venueId = venue.id;

  // Verify service belongs to venue
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id')
    .eq('id', serviceId)
    .eq('venue_id', venueId)
    .single();

  if (serviceError || !service) {
    return new Response(JSON.stringify({
      ok: false,
      code: 'service_not_found',
      message: 'Service not found for this venue'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Check for existing unexpired lock on this slot
  const { data: existingLock } = await supabase
    .from('booking_locks')
    .select('id, lock_token, expires_at')
    .eq('venue_id', venueId)
    .eq('service_id', serviceId)
    .eq('booking_date', date)
    .eq('start_time', time)
    .is('released_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (existingLock) {
    console.warn('⚠️ Slot already locked:', existingLock.lock_token);
    return new Response(JSON.stringify({
      ok: false,
      code: 'slot_locked',
      message: 'This time slot is currently being booked by another guest',
      expiresAt: existingLock.expires_at
    }), {
      status: 409,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Generate lock token
  const lockToken = crypto.randomUUID();

  // Hash client identifiers
  const ipHash = req.headers.get('x-forwarded-for') 
    ? await hashString(req.headers.get('x-forwarded-for')!)
    : null;
  const uaHash = req.headers.get('user-agent')
    ? await hashString(req.headers.get('user-agent')!)
    : null;

  // Calculate expiry
  const lockedAt = new Date();
  const expiresAt = new Date(lockedAt.getTime() + LOCK_HOLD_MINUTES * 60 * 1000);

  // Insert lock
  const { data: lock, error: lockError } = await supabase
    .from('booking_locks')
    .insert({
      venue_id: venueId,
      service_id: serviceId,
      booking_date: date,
      start_time: time,
      party_size: partySize,
      lock_token: lockToken,
      ip_hash: ipHash,
      ua_hash: uaHash,
      locked_at: lockedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      reason: 'created'
    })
    .select()
    .single();

  if (lockError) {
    console.error('❌ Lock creation failed:', lockError);
    return createErrorResponse(lockError, 500);
  }

  // Invalidate availability cache
  await invalidateAvailabilityCache(supabase, venueId, serviceId, date);

  // Log to availability_logs with enhanced tracking
  await supabase.from('availability_logs').insert({
    venue_id: venueId,
    venue_slug: venueSlug,
    service_id: serviceId,
    date: date,
    time: time,
    party_size: partySize,
    action: 'held',
    status: 'ok',
    ip_hash: ipHash,
    ua_hash: uaHash
  });

  console.log('✅ Lock created:', lockToken);

  return new Response(JSON.stringify({
    ok: true,
    lockToken,
    expiresAt: expiresAt.toISOString(),
    holdMinutes: LOCK_HOLD_MINUTES
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Endpoint: POST /locks/extend
async function handleExtendLock(supabase: any, req: Request): Promise<Response> {
  const { lockToken }: ExtendLockRequest = await req.json();

  console.log('🔄 Extending lock:', lockToken);

  if (!lockToken) {
    return new Response(JSON.stringify({
      ok: false,
      code: 'invalid_request',
      message: 'lockToken required'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Fetch lock
  const { data: lock, error: fetchError } = await supabase
    .from('booking_locks')
    .select('*')
    .eq('lock_token', lockToken)
    .is('released_at', null)
    .single();

  if (fetchError || !lock) {
    console.warn('⚠️ Lock not found or already released:', lockToken);
    return new Response(JSON.stringify({
      ok: false,
      code: 'lock_not_found',
      message: 'Lock not found or already released'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Check if expired
  if (new Date(lock.expires_at) < new Date()) {
    console.warn('⚠️ Lock already expired:', lockToken);
    return new Response(JSON.stringify({
      ok: false,
      code: 'lock_expired',
      message: 'Lock has expired'
    }), {
      status: 410,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Calculate new expiry (max 60 seconds from now, or original expiry if sooner)
  const now = new Date();
  const maxExtendTime = new Date(now.getTime() + 60 * 1000);
  const originalExpiry = new Date(lock.locked_at);
  originalExpiry.setMinutes(originalExpiry.getMinutes() + LOCK_HOLD_MINUTES);
  
  const newExpiresAt = maxExtendTime < originalExpiry ? maxExtendTime : originalExpiry;

  // Update lock
  const { error: updateError } = await supabase
    .from('booking_locks')
    .update({
      expires_at: newExpiresAt.toISOString(),
      reason: 'extended',
      updated_at: now.toISOString()
    })
    .eq('lock_token', lockToken);

  if (updateError) {
    console.error('❌ Lock extension failed:', updateError);
    return createErrorResponse(updateError, 500);
  }

  console.log('✅ Lock extended until:', newExpiresAt);

  return new Response(JSON.stringify({
    ok: true,
    expiresAt: newExpiresAt.toISOString()
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Endpoint: POST /locks/release
async function handleReleaseLock(supabase: any, req: Request): Promise<Response> {
  const { lockToken, lockId, reason = 'released' }: ReleaseLockRequest = await req.json();

  console.log('🔓 Release request:', { lockToken: !!lockToken, lockId: !!lockId, reason });

  // Validate input
  if (!lockToken && !lockId) {
    return new Response(JSON.stringify({
      ok: false,
      code: 'invalid_request',
      message: 'Either lockToken or lockId required'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // ✅ RBAC CHECK: Verify user authorization (for admin force release)
  const authHeader = req.headers.get('Authorization');
  let isAdminRelease = false;
  
  if (authHeader && (lockId || reason === 'admin_force')) {
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (!authError && user) {
      // Find lock to check venue_id
      let lockQuery = supabase
        .from('booking_locks')
        .select('id, lock_token, released_at, venue_id, service_id, booking_date, start_time, expires_at');
      
      if (lockToken) {
        lockQuery = lockQuery.eq('lock_token', lockToken);
      } else {
        lockQuery = lockQuery.eq('id', lockId);
      }

      const { data: targetLock } = await lockQuery.maybeSingle();

      if (targetLock) {
        // Check RBAC: Platform admin OR venue admin
        const { data: isPlatformAdmin } = await supabase
          .rpc('is_platform_admin', { _user_id: user.id });

        const { data: canManageVenue } = await supabase
          .rpc('user_can_manage_venue', { 
            _user_id: user.id, 
            _venue_id: targetLock.venue_id 
          });

        if (!isPlatformAdmin && !canManageVenue) {
          console.log('❌ Insufficient permissions for user', user.email);
          return new Response(JSON.stringify({
            ok: false,
            code: 'forbidden',
            message: 'You do not have permission to release this lock'
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        isAdminRelease = true;
        console.log('✅ Admin release authorized:', user.email);

        // Check idempotency
        if (targetLock.released_at) {
          console.log('🔓 Lock already released (idempotent)');
          return new Response(JSON.stringify({ 
            ok: true, 
            message: 'already_released',
            lock: {
              id: targetLock.id,
              released_at: targetLock.released_at
            }
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Release lock
        const { error: releaseError } = await supabase
          .from('booking_locks')
          .update({
            released_at: new Date().toISOString(),
            reason: reason,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetLock.id)
          .is('released_at', null);

         if (releaseError) {
          console.error('❌ Lock release failed:', releaseError);
          return createErrorResponse(releaseError, 500);
        }

        // Invalidate cache
        await invalidateAvailabilityCache(
          supabase,
          targetLock.venue_id,
          targetLock.service_id,
          targetLock.booking_date
        );

        // Log release
        await supabase.from('availability_logs').insert({
          venue_id: targetLock.venue_id,
          service_id: targetLock.service_id,
          date: targetLock.booking_date,
          time: targetLock.start_time,
          action: 'released',
          status: 'ok'
        });

        console.log('✅ Lock force-released by admin');

        return new Response(JSON.stringify({
          ok: true,
          lock: {
            id: targetLock.id,
            venue_id: targetLock.venue_id,
            booking_date: targetLock.booking_date,
            start_time: targetLock.start_time
          }
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
  }

  // Regular release flow (no auth required for lockToken-based release)
  if (!lockToken) {
    return new Response(JSON.stringify({
      ok: false,
      code: 'unauthorized',
      message: 'Authentication required for admin release'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Check if lock exists and is already released (idempotent behavior)
  const { data: existingLock } = await supabase
    .from('booking_locks')
    .select('released_at, venue_id, service_id, booking_date, start_time, id')
    .eq('lock_token', lockToken)
    .maybeSingle();

  if (existingLock && existingLock.released_at) {
    console.log('🔓 Lock already released (idempotent)');
    return new Response(JSON.stringify({ 
      ok: true, 
      message: 'already_released' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Release lock (only if not already released)
  const { error: releaseError } = await supabase
    .from('booking_locks')
    .update({
      released_at: new Date().toISOString(),
      reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq('lock_token', lockToken)
    .is('released_at', null);

  if (releaseError) {
    console.error('❌ Lock release failed:', releaseError);
    return createErrorResponse(releaseError, 500);
  }

  const lock = existingLock;

  // Invalidate cache if lock was found
  if (lock) {
    await invalidateAvailabilityCache(
      supabase,
      lock.venue_id,
      lock.service_id,
      lock.booking_date
    );

    // Log release
    await supabase.from('availability_logs').insert({
      venue_id: lock.venue_id,
      service_id: lock.service_id,
      date: lock.booking_date,
      time: lock.start_time,
      action: 'released',
      status: 'ok'
    });
  }

  console.log('✅ Lock released');

  return new Response(JSON.stringify({
    ok: true,
    lock: lock ? {
      id: lock.id,
      venue_id: lock.venue_id,
      booking_date: lock.booking_date,
      start_time: lock.start_time
    } : undefined
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Main handler
const handler = withSentry(async (req, transaction, reqId) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create service role client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const url = new URL(req.url);
    const path = url.pathname;
    
    // Determine operation and add Sentry tags
    let operation = 'unknown';
    if (path.endsWith('/create')) operation = 'create';
    else if (path.endsWith('/extend')) operation = 'extend';
    else if (path.endsWith('/release')) operation = 'release';
    
    transaction.setTag('lockAction', operation);
    transaction.setName(`POST /locks/${operation}`);

    // Route to appropriate handler with span
    if (path.endsWith('/create') && req.method === 'POST') {
      const span = transaction.startChild({ op: 'lock.create', description: 'Create lock' });
      const result = await handleCreateLock(supabase, req);
      span.finish();
      return result;
    } else if (path.endsWith('/extend') && req.method === 'POST') {
      const span = transaction.startChild({ op: 'lock.extend', description: 'Extend lock' });
      const result = await handleExtendLock(supabase, req);
      span.finish();
      return result;
    } else if (path.endsWith('/release') && req.method === 'POST') {
      const span = transaction.startChild({ op: 'lock.release', description: 'Release lock' });
      const result = await handleReleaseLock(supabase, req);
      span.finish();
      return result;
    } else {
      return new Response(JSON.stringify({
        ok: false,
        code: 'not_found',
        message: 'Endpoint not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    console.error('💥 Unexpected error:', error);
    return new Response(JSON.stringify({
      ok: false,
      code: 'internal_error',
      message: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}, 'POST /locks');

serve(handler);
