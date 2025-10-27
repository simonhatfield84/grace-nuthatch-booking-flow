import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  lockToken: z.string().uuid().nullable().optional()
});

// ========== HELPERS ==========
function jsonResponse(status: number, body: any, headers = corsHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

function sanitize(str: string | null | undefined): string | null {
  if (!str) return null;
  return str.trim().replace(/[<>]/g, '');
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMins = h * 60 + m + minutes;
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

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

// ========== TABLE ALLOCATION (server-side with proper overlap) ==========
async function allocateTableServerSide(
  supabase: any,
  params: {
    venueId: string;
    date: string;
    time: string;
    partySize: number;
    duration: number;
  }
): Promise<{ tableId: number | null }> {
  const newStart = params.time;
  const newEnd = addMinutes(params.time, params.duration);

  console.log(`📋 [TABLE_ALLOC] Finding table for party ${params.partySize} on ${params.date} ${newStart}-${newEnd}`);

  // Get all active tables sorted by capacity
  const { data: tables, error: tablesError } = await supabase
    .from('tables')
    .select('id, min_capacity, max_capacity')
    .eq('venue_id', params.venueId)
    .eq('status', 'active')
    .gte('max_capacity', params.partySize)
    .order('min_capacity', { ascending: true });

  if (tablesError || !tables || tables.length === 0) {
    console.error(`❌ [TABLE_ALLOC] No suitable tables found:`, tablesError);
    return { tableId: null };
  }

  console.log(`🔍 [TABLE_ALLOC] Checking ${tables.length} tables for conflicts`);

  // Check each table for conflicts using proper interval overlap
  for (const table of tables) {
    // Get all confirmed/pending bookings for this table on this date
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('booking_time, end_time')
      .eq('table_id', table.id)
      .eq('booking_date', params.date)
      .in('status', ['confirmed', 'pending_payment', 'seated']);

    if (bookingsError) {
      console.error(`❌ [TABLE_ALLOC] Error checking table ${table.id}:`, bookingsError);
      continue;
    }

    // Check for overlap: existing_start < new_end AND existing_end > new_start
    const hasConflict = bookings?.some((booking: any) => {
      const existingStart = booking.booking_time;
      const existingEnd = booking.end_time || addMinutes(booking.booking_time, params.duration);
      
      const overlap = existingStart < newEnd && existingEnd > newStart;
      
      if (overlap) {
        console.log(`⚠️ [TABLE_ALLOC] Table ${table.id} conflict: ${existingStart}-${existingEnd} overlaps ${newStart}-${newEnd}`);
      }
      
      return overlap;
    });

    if (!hasConflict) {
      console.log(`✅ [TABLE_ALLOC] Table ${table.id} available (capacity ${table.min_capacity}-${table.max_capacity})`);
      return { tableId: table.id };
    }
  }

  console.error(`❌ [TABLE_ALLOC] No available tables for ${params.date} ${newStart}`);
  return { tableId: null };
}

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

    console.log(`📋 [${reqId}] Input validated:`, {
      venueSlug: input.venueSlug,
      serviceId: input.serviceId.substring(0, 8) + '...',
      partySize: input.partySize,
      date: input.date,
      time: input.time,
      hasLock: !!input.lockToken
    });

    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `booking-submit:${input.venueSlug}:${clientIp}`;
    
    const { rateLimit } = await import('../_shared/rateLimit.ts');
    const allowed = await rateLimit(rateLimitKey, 10, 600); // 10 bookings per 10 minutes
    
    if (!allowed) {
      console.error(`❌ [${reqId}] Rate limit exceeded for ${clientIp}`);
      return jsonResponse(429, {
        ok: false,
        code: 'rate_limited',
        error: 'Too many booking requests. Please try again later.',
        reqId
      });
    }

    // Create Supabase admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

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
      });
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
      });
    }

    if (!service.online_bookable || !service.active) {
      console.error(`❌ [${reqId}] Service not bookable:`, service.title);
      return jsonResponse(400, {
        ok: false,
        code: 'service_unavailable',
        error: 'This service is not available for online booking',
        reqId
      });
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
      });
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
      });
    }

    // STEP 4: Allocate table server-side
    const duration = getDurationForPartySize(service.duration_rules, input.partySize);
    console.log(`⏱️ [${reqId}] Duration calculated: ${duration} mins for party of ${input.partySize}`);
    
    const allocation = await allocateTableServerSide(supabase, {
      venueId: venue.id,
      date: input.date,
      time: input.time,
      partySize: input.partySize,
      duration: duration
    });

    if (!allocation.tableId) {
      console.error(`❌ [${reqId}] No table available`);
      
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
      });
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

    console.log(`💰 [${reqId}] Payment requirement:`, {
      requiresPayment,
      amountCents,
      chargeType: service.charge_type,
      minGuests: service.minimum_guests_for_charge
    });

    // STEP 6: Insert booking (DB trigger enforces status invariants)
    const bookingStatus = requiresPayment ? 'pending_payment' : 'confirmed';
    const endTime = addMinutes(input.time, duration);
    
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
        status: bookingStatus,
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
      
      // Check if it's the payment invariant error
      if (bookingError.message?.includes('payment_required_not_enforced')) {
        return jsonResponse(400, {
          ok: false,
          code: 'payment_required_not_enforced',
          error: 'Payment is required for this booking',
          reqId
        });
      }
      
      return jsonResponse(400, {
        ok: false,
        code: 'booking_creation_failed',
        error: bookingError.message || 'Failed to create booking',
        reqId
      });
    }

    bookingId = booking.id;

    console.log(`✅ [${reqId}] Booking created:`, {
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

    // STEP 7: Handle payment or confirmation
    if (requiresPayment) {
      // Release lock with payment_required reason
      if (input.lockToken) {
        await verifyAndReleaseLock(supabase, input.lockToken, {
          venueId: venue.id,
          serviceId: service.id,
          date: input.date,
          time: input.time,
          partySize: input.partySize
        }, 'payment_required');
      }

      // Get Stripe keys
      const stripeKeys = await getStripeKeysForVenue(supabase, venue.id);
      
      if (!stripeKeys?.secret) {
        console.error(`❌ [${reqId}] Stripe not configured for venue`);
        
        // Delete the booking since we can't process payment
        await supabase.from('bookings').delete().eq('id', booking.id);
        
        return jsonResponse(500, {
          ok: false,
          code: 'stripe_not_configured',
          error: 'Payment processing is not available. Please contact the venue.',
          reqId
        });
      }

      // Create Stripe PaymentIntent with idempotency
      const stripe = new Stripe(stripeKeys.secret, {
        apiVersion: '2023-10-16'
      });

      const idempotencyKey = `booking:${booking.id}`;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'gbp',
        metadata: {
          booking_id: String(booking.id),
          booking_reference: booking.booking_reference,
          venue_slug: venue.slug,
          venue_id: venue.id,
          service_title: service.title,
          party_size: String(input.partySize),
          reqId
        },
        description: `Booking ${booking.booking_reference} at ${venue.name}`
      }, {
        idempotencyKey
      });

      console.log(`💳 [${reqId}] PaymentIntent created:`, {
        id: paymentIntent.id,
        amount: amountCents,
        testMode: stripeKeys.testMode
      });

      // Record in booking_payments
      await supabase.from('booking_payments').insert({
        booking_id: booking.id,
        venue_id: venue.id,
        stripe_payment_intent_id: paymentIntent.id,
        amount_cents: amountCents,
        status: 'pending'
      });

      return jsonResponse(200, {
        ok: true,
        booking: {
          id: booking.id,
          reference: booking.booking_reference,
          status: booking.status
        },
        payment: {
          required: true,
          client_secret: paymentIntent.client_secret,
          amount_cents: amountCents,
          publishable_key: stripeKeys.publishable
        },
        reqId
      });
    } else {
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

      // No payment required - send confirmation email
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
        booking: {
          id: booking.id,
          reference: booking.booking_reference,
          status: booking.status
        },
        payment: {
          required: false
        },
        reqId
      });
    }

  } catch (error: any) {
    console.error(`💥 [${reqId}] Unexpected error:`, error);
    
    if (error instanceof z.ZodError) {
      return jsonResponse(400, {
        ok: false,
        code: 'validation_error',
        error: 'Invalid input data',
        details: error.errors,
        reqId
      });
    }

    return jsonResponse(500, {
      ok: false,
      code: 'internal_error',
      error: error.message || 'Internal server error',
      reqId
    });
  }
};

serve(handler);
