import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { handleCors, getCorsHeaders } from '../_shared/cors.ts';
import { findAvailableTable, addMinutesToTime } from '../_shared/tableAllocation.ts';

// ========== INPUT SCHEMA ==========
const bookingSubmitSchema = z.object({
  venueSlug: z.string().min(1).max(100),
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  partySize: z.number().int().min(1).max(50),
  guest: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().max(254),
    phone: z.string().regex(/^[\d\s\-\+\(\)]{7,20}$/)
  }),
  notes: z.string().max(500).optional().nullable(),
  lockToken: z.string().uuid().nullable().optional(),
  website: z.string().max(0).optional() // Honeypot - must be empty
});

// ========== HELPERS ==========
function jsonResponse(status: number, body: any, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

function sanitize(str: string | null | undefined): string | null {
  if (!str) return null;
  return str.trim().replace(/[<>]/g, '');
}

// Removed - now using addMinutesToTime from shared tableAllocation

function getDurationForPartySize(durationRules: any, partySize: number): number {
  const DEFAULT_DURATION = 120;
  
  if (!Array.isArray(durationRules) || durationRules.length === 0) {
    return DEFAULT_DURATION;
  }
  
  // Find matching rule based on party size
  const matchingRule = durationRules.find((rule: any) => 
    partySize >= (rule.minGuests || 0) && 
    partySize <= (rule.maxGuests || 999)
  );
  
  return matchingRule?.durationMinutes || DEFAULT_DURATION;
}

// Removed - now using findAvailableTable from shared tableAllocation

// ========== LOCK VERIFICATION & RELEASE ==========
async function verifyAndReleaseLock(
  supabase: any,
  lockToken: string | null | undefined,
  params: {
    venueId: string;
    serviceId: string;
    date: string;
    time: string;
    partySize: number;
  },
  reason: string
): Promise<{ valid: boolean; error?: string }> {
  if (!lockToken) {
    console.log(`🔓 [LOCK] No lock token provided, skipping verification`);
    return { valid: true }; // No lock is ok
  }

  try {
    // Verify lock matches booking parameters
    const { data: lock, error: lockError } = await supabase
      .from('booking_locks')
      .select('*')
      .eq('lock_token', lockToken)
      .eq('venue_id', params.venueId)
      .eq('service_id', params.serviceId)
      .eq('booking_date', params.date)
      .eq('start_time', params.time)
      .eq('party_size', params.partySize)
      .is('released_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (lockError || !lock) {
      console.error(`❌ [LOCK] Invalid or expired lock:`, lockError || 'not found');
      return { valid: false, error: 'Invalid or expired lock token' };
    }

    console.log(`✅ [LOCK] Lock verified: ${lockToken.substring(0, 8)}...`);

    // Release the lock
    const { error: releaseError } = await supabase
      .from('booking_locks')
      .update({
        released_at: new Date().toISOString(),
        reason: reason
      })
      .eq('lock_token', lockToken);

    if (releaseError) {
      console.error(`⚠️ [LOCK] Failed to release lock (non-fatal):`, releaseError);
    } else {
      console.log(`🔓 [LOCK] Released with reason: ${reason}`);
    }

    return { valid: true };
  } catch (error) {
    console.error(`❌ [LOCK] Error verifying lock:`, error);
    return { valid: false, error: 'Lock verification failed' };
  }
}

// ========== STRIPE KEYS ==========
async function getStripeKeysForVenue(supabase: any, venueId: string) {
  const { data: settings } = await supabase
    .from('venue_stripe_settings')
    .select('is_active, publishable_key_live, secret_key_live, publishable_key_test, secret_key_test, test_mode')
    .eq('venue_id', venueId)
    .maybeSingle();

  if (!settings || !settings.is_active) {
    return null;
  }

  const publishable = settings.test_mode 
    ? settings.publishable_key_test 
    : settings.publishable_key_live;
    
  const secret = settings.test_mode 
    ? settings.secret_key_test 
    : settings.secret_key_live;

  if (!publishable || !secret) {
    return null;
  }

  return { publishable, secret, testMode: settings.test_mode };
}

// ========== COMPUTE AMOUNT ==========
function computeAmountCents(service: any, partySize: number): number {
  if (!service.requires_payment) return 0;

  const chargeAmountPerGuest = service.charge_amount_per_guest || 0;
  const chargeType = service.charge_type || 'all_reservations';
  const minimumGuests = service.minimum_guests_for_charge || 1;

  switch (chargeType) {
    case 'all_reservations':
      return chargeAmountPerGuest * partySize;
    case 'large_groups':
      if (partySize >= minimumGuests) {
        return chargeAmountPerGuest * partySize;
      }
      return 0;
    default:
      return chargeAmountPerGuest * partySize;
  }
}

// ========== MAIN HANDLER ==========
const handler = async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  const corsH = getCorsHeaders(req);

  const reqId = crypto.randomUUID().substring(0, 8);
  console.log(`🎫 [${reqId}] Booking submission started`);

  let bookingId: number | null = null;

  try {
    // Parse and validate input
    const body = await req.json();
    const input = bookingSubmitSchema.parse(body);

    // Bot detection: Honeypot check
    if (input.website && input.website.length > 0) {
      console.warn(`🤖 [${reqId}] Bot detected: honeypot filled`);
      // Return fake success to avoid alerting bot
      return jsonResponse(200, {
        ok: true,
        message: 'Booking received',
        reqId
      }, corsH);
    }

    console.log(`📋 [${reqId}] Input validated:`, {
      venueSlug: input.venueSlug,
      serviceId: input.serviceId.substring(0, 8) + '...',
      partySize: input.partySize,
      date: input.date,
      time: input.time,
      hasLock: !!input.lockToken
    });

    // Create Supabase admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Database-backed rate limiting (per IP + path)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() 
      || req.headers.get('x-real-ip') 
      || 'unknown';

    const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc(
      'check_rate_limit',
      {
        p_ip: clientIp,
        p_path: '/booking-submit',
        p_max_hits: 10 // 10 requests per minute
      }
    );

    if (rateLimitError || !rateLimitOk) {
      console.warn(`🚫 [${reqId}] Rate limit exceeded for IP: ${clientIp}`);
      return jsonResponse(429, { 
        ok: false, 
        code: 'rate_limit_exceeded',
        message: 'Too many booking attempts. Please try again in a minute.',
        reqId
      }, corsH);
    }

    console.log(`✅ [${reqId}] Rate limit check passed`);

    // STEP 1: Resolve venue
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name, slug, approval_status')
      .eq('slug', input.venueSlug)
      .single();

    if (venueError || !venue || venue.approval_status !== 'approved') {
      console.error(`❌ [${reqId}] Venue not found or not approved:`, input.venueSlug);
      return jsonResponse(404, {
        ok: false,
        code: 'venue_not_found',
        error: 'Venue not found or not available',
        reqId
      }, corsH);
    }

    console.log(`✅ [${reqId}] Venue resolved: ${venue.name}`);

    // STEP 2: Get service and validate
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select(`
        id, title, requires_payment, charge_type, 
        minimum_guests_for_charge, charge_amount_per_guest,
        min_guests, max_guests, duration_rules,
        online_bookable, active
      `)
      .eq('id', input.serviceId)
      .eq('venue_id', venue.id)
      .single();

    if (serviceError || !service) {
      console.error(`❌ [${reqId}] Service not found:`, input.serviceId);
      return jsonResponse(400, {
        ok: false,
        code: 'service_not_found',
        error: 'Service not found',
        reqId
      }, corsH);
    }

    if (!service.online_bookable || !service.active) {
      console.error(`❌ [${reqId}] Service not bookable:`, service.title);
      return jsonResponse(400, {
        ok: false,
        code: 'service_unavailable',
        error: 'This service is not available for online booking',
        reqId
      }, corsH);
    }

    // Validate party size
    const minGuests = service.min_guests || 1;
    const maxGuests = service.max_guests || 50;
    
    if (input.partySize < minGuests || input.partySize > maxGuests) {
      console.error(`❌ [${reqId}] Party size out of bounds:`, input.partySize);
      return jsonResponse(400, {
        ok: false,
        code: 'party_size_out_of_bounds',
        error: `Party size must be between ${minGuests} and ${maxGuests}`,
        reqId
      }, corsH);
    }

    console.log(`✅ [${reqId}] Service validated: ${service.title}`);

    // STEP 3: Verify lock (if provided)
    const lockResult = await verifyAndReleaseLock(
      supabase,
      input.lockToken,
      {
        venueId: venue.id,
        serviceId: service.id,
        date: input.date,
        time: input.time,
        partySize: input.partySize
      },
      'booking_attempt'
    );

    if (!lockResult.valid) {
      return jsonResponse(400, {
        ok: false,
        code: 'invalid_lock',
        error: lockResult.error || 'Lock verification failed',
        reqId
      }, corsH);
    }

    // STEP 4: Allocate table server-side
    const duration = getDurationForPartySize(service.duration_rules, input.partySize);
    console.log(`⏱️ [${reqId}] Duration calculated: ${duration} mins for party of ${input.partySize}`);
    
    const allocation = await findAvailableTable(supabase, {
      venueId: venue.id,
      date: input.date,
      time: input.time,
      partySize: input.partySize,
      duration: duration
    });

    if (!allocation.available || !allocation.tableId) {
      console.error(`❌ [${reqId}] No table available:`, allocation.reason);
      
      // Release lock with failure reason
      if (input.lockToken) {
        await verifyAndReleaseLock(supabase, input.lockToken, {
          venueId: venue.id,
          serviceId: service.id,
          date: input.date,
          time: input.time,
          partySize: input.partySize
        }, 'no_table_available');
      }
      
      return jsonResponse(409, {
        ok: false,
        code: 'no_table_available',
        error: 'No tables available for your requested time. Please try a different time slot.',
        reqId
      }, corsH);
    }

    console.log(`✅ [${reqId}] Table allocated: ${allocation.tableId}`);

    // STEP 5: Compute payment requirement (DB source of truth)
    const { data: requiresPaymentResult } = await supabase
      .rpc('requires_payment_for_booking', {
        p_service_id: service.id,
        p_party_size: input.partySize
      });

    const requiresPayment = !!requiresPaymentResult;
    const amountCents = requiresPayment ? computeAmountCents(service, input.partySize) : 0;
    const endTime = addMinutesToTime(input.time, duration);

    console.log(`💰 [${reqId}] Payment requirement:`, {
      requiresPayment,
      amountCents,
      chargeType: service.charge_type,
      minGuests: service.minimum_guests_for_charge
    });

    // STEP 6: Handle payment-required vs no-payment flows
    if (requiresPayment) {
      // DO NOT CREATE BOOKING - return booking data for webhook to use
      console.log(`💳 [${reqId}] Payment required, returning booking data for webhook`);

      return jsonResponse(200, {
        ok: true,
        requiresPayment: true,
        amountCents,
        bookingData: {
          venueId: venue.id,
          serviceId: service.id,
          date: input.date,
          time: input.time,
          partySize: input.partySize,
          duration,
          endTime,
          guest: {
            name: sanitize(input.guest.name),
            email: input.guest.email.toLowerCase().trim(),
            phone: sanitize(input.guest.phone),
          },
          notes: sanitize(input.notes),
          lockToken: input.lockToken,
          allocation: { tableId: allocation.tableId },
          service: service.title,
          venueName: venue.name,
          venueSlug: venue.slug,
        },
        reqId
      }, corsH);
    } else {
      // No payment required - create confirmed booking immediately
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          venue_id: venue.id,
          service_id: service.id,
          service: service.title,
          guest_name: sanitize(input.guest.name),
          email: input.guest.email.toLowerCase().trim(),
          phone: sanitize(input.guest.phone),
          party_size: input.partySize,
          booking_date: input.date,
          booking_time: input.time,
          end_time: endTime,
          duration_minutes: duration,
          table_id: allocation.tableId,
          is_unallocated: false,
          source: 'widget',
          status: 'confirmed',
          notes: sanitize(input.notes)
        })
        .select('id, booking_reference, status')
        .single();

      if (bookingError) {
        console.error(`❌ [${reqId}] Booking insert failed:`, bookingError);
        
        // Release lock on failure
        if (input.lockToken) {
          await verifyAndReleaseLock(supabase, input.lockToken, {
            venueId: venue.id,
            serviceId: service.id,
            date: input.date,
            time: input.time,
            partySize: input.partySize
          }, 'booking_failed');
        }
        
        return jsonResponse(400, {
          ok: false,
          code: 'booking_creation_failed',
          error: bookingError.message || 'Failed to create booking',
          reqId
        }, corsH);
      }

      bookingId = booking.id;

      console.log(`✅ [${reqId}] Booking created and confirmed:`, {
        id: booking.id,
        reference: booking.booking_reference,
        status: booking.status
      });

      // Create audit log
      await supabase.from('booking_audit').insert({
        booking_id: booking.id,
        venue_id: venue.id,
        change_type: 'created',
        source_type: 'widget',
        source_details: {
          reqId,
          partySize: input.partySize,
          date: input.date,
          time: input.time,
          service: service.title
        }
      });

      // Release lock with confirmed reason
      if (input.lockToken) {
        await verifyAndReleaseLock(supabase, input.lockToken, {
          venueId: venue.id,
          serviceId: service.id,
          date: input.date,
          time: input.time,
          partySize: input.partySize
        }, 'confirmed');
      }

      // Send confirmation email
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            booking_id: booking.id,
            guest_email: input.guest.email,
            venue_id: venue.id,
            email_type: 'booking_confirmation'
          }
        });
        console.log(`📧 [${reqId}] Confirmation email sent`);
      } catch (emailError) {
        console.error(`⚠️ [${reqId}] Email send failed (non-fatal):`, emailError);
      }

      return jsonResponse(200, {
        ok: true,
        requiresPayment: false,
        booking: {
          id: booking.id,
          reference: booking.booking_reference,
          status: booking.status
        },
        reqId
      }, corsH);
    }

  } catch (error: any) {
    console.error(`💥 [${reqId}] Unexpected error:`, error);
    
    const corsH = getCorsHeaders(req);
    
    if (error instanceof z.ZodError) {
      return jsonResponse(400, {
        ok: false,
        code: 'validation_error',
        error: 'Invalid input data',
        details: error.errors,
        reqId
      }, corsH);
    }

    return jsonResponse(500, {
      ok: false,
      code: 'internal_error',
      error: error.message || 'Internal server error',
      reqId
    }, corsH);
  }
};

serve(handler);
