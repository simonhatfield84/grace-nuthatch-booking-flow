import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { ok, err, jsonResponse } from '../_shared/apiResponse.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const availabilityRequestSchema = z.object({
  venueSlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Venue slug must contain only lowercase letters, numbers, and hyphens'),
  serviceId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  partySize: z.number().int().min(1).max(100, 'Party size must be between 1 and 100'),
});

interface AvailabilityRequest {
  venueSlug: string;
  serviceId?: string;
  date: string;
  partySize: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const RATE_LIMIT_WINDOW_MS = 60000; // 60 seconds
const RATE_LIMIT_MAX_REQUESTS = 10;
const CACHE_TTL_MS = 60000; // 60 seconds

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const requestData = await req.json();
    
    // Validate input with Zod
    const validationResult = availabilityRequestSchema.safeParse(requestData);
    if (!validationResult.success) {
      return jsonResponse(
        err('invalid_input', 'Invalid input parameters', undefined, {
          errors: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }),
        400,
        corsHeaders
      );
    }
    
    const { venueSlug, serviceId, date, partySize }: AvailabilityRequest = validationResult.data;

    // Get client IP and User-Agent
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Hash IP and UA for privacy
    const ipHash = await sha256(`${clientIP}:${Deno.env.get('HASH_SALT') || 'default-salt'}`);
    const uaHash = await sha256(`${userAgent}:${Deno.env.get('HASH_SALT') || 'default-salt'}`);

    // Step 1: Resolve venue
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name, slug')
      .eq('slug', venueSlug)
      .eq('approval_status', 'approved')
      .single();

    if (venueError || !venue) {
      await logAvailability(supabase, {
        venue_slug: venueSlug,
        status: 'error',
        error_text: 'Venue not found',
        ip_hash: ipHash,
        ua_hash: uaHash,
        took_ms: Date.now() - startTime,
      });

      return jsonResponse(
        err('venue_not_found', 'Venue not found or not approved'),
        404,
        corsHeaders
      );
    }

    // Step 2: Rate limiting check
    const rateLimitExceeded = await checkRateLimit(supabase, ipHash, venue.id, serviceId);
    if (rateLimitExceeded) {
      await logAvailability(supabase, {
        venue_id: venue.id,
        venue_slug: venueSlug,
        date,
        party_size: partySize,
        ip_hash: ipHash,
        ua_hash: uaHash,
        status: 'rate_limited',
        took_ms: Date.now() - startTime,
      });

      return jsonResponse(
        err('rate_limited', "We're getting lots of interest—please try again in a moment."),
        429,
        corsHeaders
      );
    }

    // Step 3: Check cache
    const cachedResult = await checkCache(supabase, venue.id, serviceId, date, partySize);
    if (cachedResult) {
      await logAvailability(supabase, {
        venue_id: venue.id,
        venue_slug: venueSlug,
        service_id: serviceId,
        date,
        party_size: partySize,
        ip_hash: ipHash,
        ua_hash: uaHash,
        status: 'ok',
        cached: true,
        result_slots: cachedResult.slots?.length || 0,
        took_ms: Date.now() - startTime,
      });

      return jsonResponse(
        { ...cachedResult, cached: true },
        200,
        corsHeaders
      );
    }

    // Step 4: Calculate availability
    const availabilityResult = await calculateAvailability(supabase, venue.id, serviceId, date, partySize);

    if (!availabilityResult.ok) {
      await logAvailability(supabase, {
        venue_id: venue.id,
        venue_slug: venueSlug,
        service_id: serviceId,
        date,
        party_size: partySize,
        ip_hash: ipHash,
        ua_hash: uaHash,
        status: 'error',
        error_text: availabilityResult.message,
        took_ms: Date.now() - startTime,
      });

      return jsonResponse(availabilityResult, 400, corsHeaders);
    }

    const response = {
      ok: true,
      venueId: venue.id,
      serviceId: availabilityResult.serviceId,
      date,
      partySize,
      slots: availabilityResult.slots,
      cached: false,
      took_ms: Date.now() - startTime,
    };

    // Step 5: Write to cache (only if serviceId exists)
    if (availabilityResult.serviceId) {
      await writeCache(supabase, venue.id, availabilityResult.serviceId, date, partySize, response);
    }

    // Step 6: Log success
    await logAvailability(supabase, {
      venue_id: venue.id,
      venue_slug: venueSlug,
      service_id: availabilityResult.serviceId,
      date,
      party_size: partySize,
      ip_hash: ipHash,
      ua_hash: uaHash,
      status: 'ok',
      cached: false,
      result_slots: availabilityResult.slots.filter((s: TimeSlot) => s.available).length,
      took_ms: Date.now() - startTime,
    });

    return jsonResponse(response, 200, corsHeaders);
  } catch (error) {
    console.error('Availability check error:', error);
    return jsonResponse(
      err('server_error', 'Internal server error'),
      500,
      corsHeaders
    );
  }
});

// Helper: SHA-256 hash
async function sha256(input: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Helper: Rate limit check
async function checkRateLimit(supabase: any, ipHash: string, venueId: string, serviceId?: string): Promise<boolean> {
  let query = supabase
    .from('availability_logs')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .eq('venue_id', venueId)
    .gte('occurred_at', new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString());
  
  if (serviceId) {
    query = query.eq('service_id', serviceId);
  }

  const { count } = await query;
  return (count || 0) >= RATE_LIMIT_MAX_REQUESTS;
}

// Helper: Check cache
async function checkCache(
  supabase: any,
  venueId: string,
  serviceId: string | undefined,
  date: string,
  partySize: number
): Promise<any | null> {
  if (!serviceId) return null;  // No cache without service
  
  const { data } = await supabase
    .from('availability_cache')
    .select('payload, created_at')
    .eq('venue_id', venueId)
    .eq('service_id', serviceId)
    .eq('date', date)
    .eq('party_size', partySize)
    .gte('created_at', new Date(Date.now() - CACHE_TTL_MS).toISOString())
    .single();

  return data ? data.payload : null;
}

// Helper: Write to cache
async function writeCache(
  supabase: any,
  venueId: string,
  serviceId: string,
  date: string,
  partySize: number,
  payload: any
): Promise<void> {
  await supabase.from('availability_cache').upsert(
    {
      venue_id: venueId,
      service_id: serviceId || '',
      date,
      party_size: partySize,
      payload,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'venue_id,service_id,date,party_size' }
  );
}

// Helper: Log availability check
async function logAvailability(supabase: any, logData: any): Promise<void> {
  await supabase.from('availability_logs').insert({
    ...logData,
    occurred_at: new Date().toISOString(),
  });
}

// Helper: Calculate availability
async function calculateAvailability(
  supabase: any,
  venueId: string,
  serviceId: string | undefined,
  date: string,
  partySize: number
): Promise<any> {
  // CRITICAL: Require serviceId - fail fast if missing
  if (!serviceId) {
    return {
      ok: false,
      code: 'missing_service_id',
      message: 'Service ID is required for availability checks',
    };
  }

  // Validate serviceId is a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(serviceId)) {
    return {
      ok: false,
      code: 'invalid_service_id',
      message: 'Service ID must be a valid UUID',
    };
  }

  // Get service and verify it belongs to this venue
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('*, booking_windows(*)')
    .eq('id', serviceId)
    .eq('venue_id', venueId)  // Verify venue ownership
    .eq('active', true)
    .eq('online_bookable', true)
    .single();

  if (serviceError || !service) {
    return {
      ok: false,
      code: 'service_not_found',
      message: 'Service not found or not available for online booking',
    };
  }

  // Verify service supports the requested party size
  if (partySize < service.min_guests || partySize > service.max_guests) {
    return {
      ok: false,
      code: 'party_size_invalid',
      message: `This service requires between ${service.min_guests} and ${service.max_guests} guests`,
    };
  }

  // Get tables for venue
  const { data: tables } = await supabase
    .from('tables')
    .select('id, seats, label')
    .eq('venue_id', venueId)
    .eq('online_bookable', true)
    .eq('status', 'active')
    .gte('seats', partySize);

  if (!tables || tables.length === 0) {
    return {
      ok: true,
      serviceId: service.id,
      slots: [],
    };
  }

  // Get existing bookings for this date
  const { data: bookings } = await supabase
    .from('bookings')
    .select('booking_time, end_time, table_id, party_size')
    .eq('venue_id', venueId)
    .eq('booking_date', date)
    .in('status', ['confirmed', 'seated']);

  // Get blocks for this date
  const { data: blocks } = await supabase
    .from('blocks')
    .select('start_time, end_time, table_ids')
    .eq('venue_id', venueId)
    .eq('date', date);

  // Get active locks for this date/service
  const { data: locks } = await supabase
    .from('booking_locks')
    .select('start_time, party_size')
    .eq('venue_id', venueId)
    .eq('service_id', serviceId)
    .eq('booking_date', date)
    .is('released_at', null)
    .gt('expires_at', new Date().toISOString());

  // Generate time slots
  const slots = generateTimeSlots(service.booking_windows || [], date);

  // Check availability for each slot
  const availableSlots = slots.map((time) => {
    return {
      time,
      available: checkSlotAvailabilityWithLocks(
        time, 
        tables, 
        bookings || [], 
        blocks || [], 
        locks || [],
        partySize,
        service.duration_minutes || 120
      ),
    };
  });

  return {
    ok: true,
    serviceId: service.id,
    slots: availableSlots,
  };
}

// Helper: Generate time slots from booking windows
function generateTimeSlots(windows: any[], date: string): string[] {
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const slots: string[] = [];

  for (const window of windows) {
    if (!window.days || !window.days.includes(dayOfWeek)) continue;

    const startMinutes = timeToMinutes(window.start_time);
    const endMinutes = timeToMinutes(window.end_time);

    for (let minutes = startMinutes; minutes < endMinutes; minutes += 15) {
      slots.push(minutesToTime(minutes));
    }
  }

  return [...new Set(slots)].sort();
}

// Helper: Check slot availability accounting for locks
function checkSlotAvailabilityWithLocks(
  time: string,
  tables: any[],
  bookings: any[],
  blocks: any[],
  locks: any[],
  partySize: number,
  durationMinutes: number
): boolean {
  const slotStart = timeToMinutes(time);
  const slotEnd = slotStart + durationMinutes;

  // Check if time is blocked (venue-wide blocks)
  for (const block of blocks) {
    const blockStart = timeToMinutes(block.start_time);
    const blockEnd = timeToMinutes(block.end_time);

    if (slotStart < blockEnd && slotEnd > blockStart) {
      if (!block.table_ids || block.table_ids.length === 0) {
        return false; // Venue-wide block
      }
    }
  }

  // Find booked table IDs
  const bookedTableIds = bookings
    .filter((b) => {
      const bookingStart = timeToMinutes(b.booking_time);
      const bookingEnd = timeToMinutes(b.end_time);
      return slotStart < bookingEnd && slotEnd > bookingStart;
    })
    .map((b) => b.table_id);

  // Only consider locks for the exact same time slot
  const locksAtThisTime = locks.filter(lock => {
    return lock.start_time === time;
  });

  // Simulate table allocation for each lock
  let lockedTableIds: number[] = [];
  for (const lock of locksAtThisTime) {
    const availableForLock = tables.filter(t => 
      !bookedTableIds.includes(t.id) && 
      !lockedTableIds.includes(t.id)
    );
    
    // Find smallest table(s) that can accommodate lock party
    const suitableTables = availableForLock
      .filter(t => t.seats >= lock.party_size)
      .sort((a, b) => a.seats - b.seats);
    
    if (suitableTables.length > 0) {
      // Allocate the smallest suitable table for this lock
      lockedTableIds.push(suitableTables[0].id);
    }
  }

  // Now check if remaining tables can accommodate the NEW party
  const unavailableTableIds = [...bookedTableIds, ...lockedTableIds];
  const availableTables = tables.filter(t => !unavailableTableIds.includes(t.id));

  // Check if any single table can fit the party
  const suitableSingleTable = availableTables.find(t => t.seats >= partySize);
  if (suitableSingleTable) {
    return true;
  }

  // For now, return false if no single table fits
  // TODO: Add join group logic for combining tables
  return false;
}

// Helper: Time string to minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper: Minutes to time string
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
