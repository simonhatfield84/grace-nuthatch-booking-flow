
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { z } from "https://esm.sh/zod@3.23.8";
import { createErrorResponse, corsHeaders } from '../_shared/errorSanitizer.ts';

// Inline security utilities for edge function
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

class AdvancedRateLimiter {
  private static limits = new Map<string, { count: number; resetTime: number; level: 'low' | 'medium' | 'high' }>();

  static async checkLimit(
    identifier: string, 
    config: RateLimitConfig,
    threatLevel: 'low' | 'medium' | 'high' = 'low'
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const key = `${identifier}-${config.windowMs}`;
    
    // Adjust limits based on threat level
    const adjustedMax = threatLevel === 'high' ? Math.floor(config.maxRequests * 0.5) : 
                      threatLevel === 'medium' ? Math.floor(config.maxRequests * 0.75) : 
                      config.maxRequests;

    let limit = this.limits.get(key);
    
    if (!limit || now >= limit.resetTime) {
      limit = { 
        count: 1, 
        resetTime: now + config.windowMs,
        level: threatLevel 
      };
      this.limits.set(key, limit);
      return { allowed: true, remaining: adjustedMax - 1, resetTime: limit.resetTime };
    }

    if (limit.count >= adjustedMax) {
      return { allowed: false, remaining: 0, resetTime: limit.resetTime };
    }

    limit.count++;
    this.limits.set(key, limit);
    return { allowed: true, remaining: adjustedMax - limit.count, resetTime: limit.resetTime };
  }

  static getClientIdentifier(req: Request): string {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    return `${ip}-${userAgent.slice(0, 50)}`;
  }
}

function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .slice(0, 1000); // Limit length
}

function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().slice(0, 254);
}

function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d\s\-\+\(\)]/g, '').trim().slice(0, 20);
}

async function logSecurityEvent(
  supabase: any,
  eventType: string,
  details: Record<string, any>,
  req: Request,
  venueId?: string
) {
  try {
    await supabase
      .from('security_audit')
      .insert({
        event_type: eventType,
        event_details: details,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
        venue_id: venueId,
      });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

function detectThreatLevel(req: Request, identifier: string): 'low' | 'medium' | 'high' {
  const userAgent = req.headers.get('user-agent') || '';
  const referer = req.headers.get('referer') || '';
  
  // High threat indicators
  if (
    userAgent.includes('bot') ||
    userAgent.includes('crawler') ||
    userAgent.length < 10 ||
    !referer.includes(req.headers.get('origin') || '')
  ) {
    return 'high';
  }
  
  // Medium threat indicators
  if (userAgent.includes('curl') || userAgent.includes('wget')) {
    return 'medium';
  }
  
  return 'low';
}

// Enhanced validation schema with lockToken support and required fields
const bookingCreateSchema = z.object({
  booking: z.object({
    guest_name: z.string().min(2, "Guest name must be at least 2 characters").max(100, "Guest name too long").trim(),
    email: z.string().email("Invalid email format").max(254, "Email too long"),
    phone: z.string().regex(/^[\d\s\-\+\(\)]{7,20}$/, "Invalid phone format"),
    party_size: z.number().int().min(1, "Party size must be at least 1").max(50, "Party size too large"),
    booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    booking_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
    service: z.string().min(1, "Service is required").max(100, "Service name too long"),
    service_id: z.string().uuid("Invalid service ID").nullable().optional(),
    notes: z.string().max(500, "Notes too long").nullable().optional(),
    venue_id: z.string().uuid("Invalid venue ID"),
    status: z.enum(['pending_payment', 'confirmed']).optional(),
    table_id: z.number().int().nullable().optional(),
    is_unallocated: z.boolean().optional(),
    source: z.enum(['widget', 'admin', 'walkin']).optional(),
  }),
  lockToken: z.string().uuid().nullable(),
});

type BookingRequest = z.infer<typeof bookingCreateSchema>;

// Helper: Validate lock token
async function validateLock(
  supabase: any,
  lockToken: string,
  bookingData: any
): Promise<any> {
  const { data: lock, error } = await supabase
    .from('booking_locks')
    .select('*')
    .eq('lock_token', lockToken)
    .eq('venue_id', bookingData.venue_id)
    .eq('booking_date', bookingData.booking_date)
    .eq('start_time', bookingData.booking_time)
    .is('released_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !lock) {
    throw new Error('invalid_lock_token');
  }

  return lock;
}

// Helper: Invalidate availability cache
async function invalidateBookingCache(
  supabase: any,
  venueId: string,
  serviceId: string | null,
  bookingDate: string
): Promise<void> {
  if (!serviceId) return;
  
  await supabase
    .from('availability_cache')
    .delete()
    .eq('venue_id', venueId)
    .eq('service_id', serviceId)
    .eq('date', bookingDate);
  
  console.log('✅ Invalidated availability cache for:', { venueId, serviceId, bookingDate });
}

// Helper: Safe lock release (idempotent)
async function safeReleaseLock(
  supabase: any,
  lockToken: string,
  reason: string
): Promise<void> {
  try {
    await supabase
      .from('booking_locks')
      .update({
        released_at: new Date().toISOString(),
        reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('lock_token', lockToken)
      .is('released_at', null);
    
    console.log(`✅ Lock released: ${lockToken.substring(0, 8)}... (reason: ${reason})`);
  } catch (error) {
    console.error('⚠️ Failed to release lock (non-fatal):', error);
  }
}

const handler = async (req: Request): Promise<Response> => {
  const reqId = crypto.randomUUID();
  const t0 = Date.now();
  const log = (...args: any[]) => console.log(`[booking-create][${reqId}]`, ...args);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  let validatedLock: any = null;
  let bookingCreated = false;
  let serviceId: string | null = null;
  let lockToken: string | null = null;

  try {
    log('🔒 Request received');

    // Advanced rate limiting with threat detection
    const clientId = AdvancedRateLimiter.getClientIdentifier(req);
    const threatLevel = detectThreatLevel(req, clientId);
    
    const baseLimit = threatLevel === 'high' ? 5 : threatLevel === 'medium' ? 8 : 15;
    const rateLimitResult = await AdvancedRateLimiter.checkLimit(
      clientId,
      { windowMs: 15 * 60 * 1000, maxRequests: baseLimit },
      threatLevel
    );

    if (!rateLimitResult.allowed) {
      console.log('🚫 Rate limit exceeded for IP:', clientId);
      await logSecurityEvent(supabaseAdmin, 'booking_created', {
        error: 'rate_limit_exceeded',
        threat_level: threatLevel,
        client_id: clientId
      }, req);
      return new Response('Rate limit exceeded', { 
        status: 429, 
        headers: corsHeaders 
      });
    }

    // Parse and validate request
    let requestData: BookingRequest;
    try {
      const rawData = await req.json();
      lockToken = rawData?.lockToken;
      
      log('📥 Incoming data:', {
        venue_id: rawData?.booking?.venue_id,
        service_id: rawData?.booking?.service_id,
        service: rawData?.booking?.service,
        booking_date: rawData?.booking?.booking_date,
        booking_time: rawData?.booking?.booking_time,
        party_size: rawData?.booking?.party_size,
        has_lock: !!lockToken,
        has_email: !!rawData?.booking?.email,
        has_phone: !!rawData?.booking?.phone,
        source: rawData?.booking?.source
      });
      
      requestData = bookingCreateSchema.parse(rawData);
      log('✅ Schema validation passed');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        log('❌ Validation errors:', errors);
        await logSecurityEvent(supabaseAdmin, 'booking_created', {
          error: 'validation_failed',
          validation_errors: errors,
          threat_level: threatLevel
        }, req);
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Invalid booking data',
          errors,
          reqId 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      throw error;
    }

    const { booking: bookingData } = requestData;

    // Sanitize input
    const sanitizedData = {
      guest_name: sanitizeInput(bookingData.guest_name),
      email: sanitizeEmail(bookingData.email),
      phone: sanitizePhone(bookingData.phone),
      party_size: Math.floor(bookingData.party_size),
      booking_date: bookingData.booking_date,
      booking_time: bookingData.booking_time,
      service: sanitizeInput(bookingData.service),
      notes: bookingData.notes ? sanitizeInput(bookingData.notes) : null,
      venue_id: bookingData.venue_id,
      status: bookingData.status || 'confirmed',
      table_id: bookingData.table_id || null,
      is_unallocated: bookingData.is_unallocated || false,
      source: bookingData.source || 'widget',
    };

    serviceId = bookingData.service_id || null;
    log('🧼 Data sanitized');

    // Verify venue
    const { data: venue, error: venueError } = await supabaseAdmin
      .from('venues')
      .select('id, approval_status, name')
      .eq('id', sanitizedData.venue_id)
      .single();

    if (venueError || !venue) {
      console.error('❌ Venue not found:', venueError);
      await logSecurityEvent(supabaseAdmin, 'booking_created', {
        error: 'venue_not_found',
        venue_id: sanitizedData.venue_id,
        threat_level: threatLevel
      }, req);
      return new Response('Venue not found', { status: 404, headers: corsHeaders });
    }

    if (venue.approval_status !== 'approved') {
      console.error('❌ Venue not approved:', venue.approval_status);
      await logSecurityEvent(supabaseAdmin, 'booking_created', {
        error: 'venue_not_approved',
        venue_id: sanitizedData.venue_id,
        approval_status: venue.approval_status,
        threat_level: threatLevel
      }, req, sanitizedData.venue_id);
      return new Response('Venue not available for bookings', { status: 403, headers: corsHeaders });
    }

    // Get service ID for cache invalidation
    const { data: service } = await supabaseAdmin
      .from('services')
      .select('id')
      .eq('venue_id', venue.id)
      .eq('title', sanitizedData.service)
      .maybeSingle();

    serviceId = service?.id || null;

    // Validate lock token if provided
    if (lockToken) {
      log('🔒 Validating lock token:', lockToken.substring(0, 8) + '...');
      validatedLock = await validateLock(supabaseAdmin, lockToken, sanitizedData);
      log('✅ Lock validated');
    }

    // Validate booking date
    const bookingDate = new Date(sanitizedData.booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      throw new Error('Cannot book for past dates');
    }

    // Check for potential duplicates
    if (sanitizedData.email || sanitizedData.phone) {
      const { data: duplicateBookings } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('venue_id', sanitizedData.venue_id)
        .eq('booking_date', sanitizedData.booking_date)
        .eq('booking_time', sanitizedData.booking_time)
        .or(`email.eq.${sanitizedData.email || ''},phone.eq.${sanitizedData.phone || ''}`)
        .limit(1);

      if (duplicateBookings && duplicateBookings.length > 0) {
        console.log('⚠️ Potential duplicate booking detected');
      }
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert(sanitizedData)
      .select()
      .single();

    if (bookingError) {
      log('❌ DB error:', {
        code: bookingError.code,
        message: bookingError.message,
        detail: bookingError.detail,
        hint: bookingError.hint
      });
      
      // Check for slot conflict
      if (bookingError.code === '23P01' || bookingError.message?.includes('bookings_no_overlap_per_table')) {
        throw new Error('slot_conflict');
      }
      throw new Error('Failed to create booking');
    }

    bookingCreated = true;
    log('✅ Booking created:', {
      id: booking.id,
      reference: booking.booking_reference,
      took_ms: Date.now() - t0
    });

    // Create audit log
    try {
      const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';
      
      await supabaseAdmin.from('booking_audit').insert([{
        booking_id: booking.id,
        change_type: 'created',
        changed_by: 'guest',
        notes: `Booking created via widget by ${sanitizedData.guest_name}`,
        venue_id: sanitizedData.venue_id,
        source_type: 'guest_via_widget',
        source_details: {
          ip_address: ipAddress,
          user_agent: userAgent,
          threat_level: threatLevel,
          party_size: sanitizedData.party_size,
          service: sanitizedData.service,
          timestamp: new Date().toISOString()
        },
        email_status: 'not_applicable'
      }]);
    } catch (auditError) {
      console.error('⚠️ Audit log failed (non-fatal):', auditError);
    }

    // Log success
    await logSecurityEvent(supabaseAdmin, 'booking_created', {
      booking_id: booking.id,
      party_size: sanitizedData.party_size,
      success: true
    }, req, sanitizedData.venue_id);

    return new Response(JSON.stringify({
      booking: {
        id: booking.id,
        booking_reference: booking.booking_reference,
        guest_name: booking.guest_name,
        party_size: booking.party_size,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time
      },
      reqId
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    log('💥 Error:', {
      message: error.message,
      type: error.constructor.name,
      took_ms: Date.now() - t0
    });
    
    await logSecurityEvent(supabaseAdmin, 'booking_created', {
      error: error.message,
      success: false
    }, req);

    // Handle specific error types with user-friendly messages
    if (error.message === 'invalid_lock_token') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Time slot lock has expired. Please select your time again.',
        code: 'lock_expired',
        reqId
      }), { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (error.message === 'slot_conflict') {
      return new Response(JSON.stringify({
        success: false,
        error: 'This time slot is no longer available. Please select another time.',
        code: 'slot_conflict',
        reqId
      }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Generic error response with sanitization
    return createErrorResponse(error, 500);

  } finally {
    // ALWAYS release lock and invalidate cache, even on validation errors
    if (lockToken) {
      log('🔓 Releasing lock...');
      const releaseReason = bookingCreated ? 'created' : 'error';
      await safeReleaseLock(supabaseAdmin, lockToken, releaseReason);
      
      // Invalidate cache if we have validated lock data
      if (validatedLock) {
        await invalidateBookingCache(
          supabaseAdmin,
          validatedLock.venue_id,
          serviceId,
          validatedLock.booking_date
        );

        // Log to availability_logs
        await supabaseAdmin.from('availability_logs').insert({
          venue_id: validatedLock.venue_id,
          service_id: serviceId,
          date: validatedLock.booking_date,
          time: validatedLock.start_time,
          action: 'released',
          status: bookingCreated ? 'ok' : 'error',
          result_slots: null
        }).catch(() => {});
      }
    }
  }
};

serve(handler);
