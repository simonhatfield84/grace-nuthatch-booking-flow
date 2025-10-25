
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Enhanced validation schema
const bookingCreateSchema = z.object({
  guest_name: z.string().min(2, "Guest name must be at least 2 characters").max(100, "Guest name too long").trim(),
  email: z.string().email("Invalid email format").max(254, "Email too long").optional(),
  phone: z.string().regex(/^[\d\s\-\+\(\)]{7,20}$/, "Invalid phone format").optional(),
  party_size: z.number().int().min(1, "Party size must be at least 1").max(50, "Party size too large"),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  booking_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  service: z.string().max(100, "Service name too long").optional(),
  notes: z.string().max(500, "Notes too long").optional(),
  venue_id: z.string().uuid("Invalid venue ID"),
});

type BookingRequest = z.infer<typeof bookingCreateSchema>;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔒 Enhanced secure booking creation request received');

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

    // Advanced rate limiting with threat detection
    const clientId = AdvancedRateLimiter.getClientIdentifier(req);
    const threatLevel = detectThreatLevel(req, clientId);
    
    // Adjusted rate limits based on threat level
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

    // Parse and validate request body with enhanced error handling
    let bookingData: BookingRequest;
    try {
      const rawData = await req.json();
      bookingData = bookingCreateSchema.parse(rawData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        console.error('❌ Validation errors:', errors);
        await logSecurityEvent(supabaseAdmin, 'booking_created', {
          error: 'validation_failed',
          validation_errors: errors,
          threat_level: threatLevel
        }, req);
        return new Response(JSON.stringify({ errors }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      throw error;
    }

    // Enhanced input sanitization
    const sanitizedData = {
      guest_name: sanitizeInput(bookingData.guest_name),
      email: bookingData.email ? sanitizeEmail(bookingData.email) : null,
      phone: bookingData.phone ? sanitizePhone(bookingData.phone) : null,
      party_size: Math.floor(bookingData.party_size),
      booking_date: bookingData.booking_date,
      booking_time: bookingData.booking_time,
      service: bookingData.service ? sanitizeInput(bookingData.service) : 'Dinner',
      notes: bookingData.notes ? sanitizeInput(bookingData.notes) : null,
      venue_id: bookingData.venue_id,
    };

    // Enhanced venue verification with additional security checks
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

    // Validate lock token for public bookings
    const lockToken = bookingData.lockToken || (await req.json()).lockToken;
    if (lockToken) {
      console.log('🔒 Validating lock token for public booking');
      
      const { data: lock, error: lockError } = await supabaseAdmin
        .from('booking_locks')
        .select('*')
        .eq('lock_token', lockToken)
        .eq('venue_id', sanitizedData.venue_id)
        .eq('booking_date', sanitizedData.booking_date)
        .eq('booking_time', sanitizedData.booking_time)
        .is('released_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (lockError || !lock) {
        console.error('❌ Invalid or expired lock token');
        await logSecurityEvent(supabaseAdmin, 'booking_created', {
          error: 'invalid_lock_token',
          lock_token: lockToken?.substring(0, 8) + '...',
          threat_level: 'high'
        }, req, sanitizedData.venue_id);
        return new Response(JSON.stringify({
          success: false,
          error: 'Time slot lock has expired. Please select your time again.'
        }), { 
          status: 410, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('✅ Lock validated:', lock.lock_token.substring(0, 8) + '...');
    }

    // Check for potential duplicate bookings (same email/phone, same date/time)
    if (sanitizedData.email || sanitizedData.phone) {
      const { data: duplicateBookings } = await supabaseAdmin
        .from('bookings')
        .select('id, guest_name')
        .eq('venue_id', sanitizedData.venue_id)
        .eq('booking_date', sanitizedData.booking_date)
        .eq('booking_time', sanitizedData.booking_time)
        .or(`email.eq.${sanitizedData.email || ''},phone.eq.${sanitizedData.phone || ''}`)
        .limit(1);

      if (duplicateBookings && duplicateBookings.length > 0) {
        console.log('⚠️ Potential duplicate booking detected');
        await logSecurityEvent(supabaseAdmin, 'booking_created', {
          warning: 'potential_duplicate',
          existing_booking_id: duplicateBookings[0].id,
          threat_level: threatLevel
        }, req, sanitizedData.venue_id);
      }
    }

    // Additional business logic validation
    const bookingDate = new Date(sanitizedData.booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      console.error('❌ Cannot book in the past');
      await logSecurityEvent(supabaseAdmin, 'booking_created', {
        error: 'booking_in_past',
        booking_date: sanitizedData.booking_date,
        threat_level: threatLevel
      }, req, sanitizedData.venue_id);
      return new Response('Cannot book for past dates', { status: 400, headers: corsHeaders });
    }

    // Create the booking with enhanced error handling
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert(sanitizedData)
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Booking creation error:', bookingError);
      await logSecurityEvent(supabaseAdmin, 'booking_created', {
        error: 'database_error',
        db_error: bookingError.message,
        threat_level: threatLevel
      }, req, sanitizedData.venue_id);
      throw new Error('Failed to create booking');
    }

    // Enhanced audit logging for guest-created booking
    try {
      const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';
      
      await supabaseAdmin
        .from('booking_audit')
        .insert([{
          booking_id: booking.id,
          change_type: 'created',
          changed_by: 'guest',
          notes: `Booking created via online widget by ${sanitizedData.guest_name}`,
          venue_id: sanitizedData.venue_id,
          source_type: 'guest_via_widget',
          source_details: {
            ip_address: ipAddress,
            user_agent: userAgent,
            threat_level: threatLevel,
            party_size: sanitizedData.party_size,
            service: sanitizedData.service,
            interface: 'booking_widget',
            timestamp: new Date().toISOString()
          },
          email_status: 'not_applicable' // Email will be sent after payment if required
        }]);
      
      console.log('✅ Guest booking audit entry created');
    } catch (auditError) {
      console.error('❌ Failed to create audit entry:', auditError);
      // Don't fail the booking creation for audit logging failures
    }

    // Release lock if provided
    if (lockToken) {
      await supabaseAdmin
        .from('booking_locks')
        .update({
          released_at: new Date().toISOString(),
          reason: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('lock_token', lockToken);
      
      console.log('✅ Lock released after booking creation');
    }

    // Log successful booking creation
    await logSecurityEvent(supabaseAdmin, 'booking_created', {
      booking_id: booking.id,
      party_size: sanitizedData.party_size,
      booking_date: sanitizedData.booking_date,
      venue_name: venue.name,
      threat_level: threatLevel,
      success: true
    }, req, sanitizedData.venue_id);

    console.log('✅ Booking created successfully:', booking.id);
    return new Response(JSON.stringify({
      booking: {
        id: booking.id,
        booking_reference: booking.booking_reference,
        guest_name: booking.guest_name,
        party_size: booking.party_size,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('💥 Booking creation error:', error);
    return new Response(`Booking error: ${error.message}`, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
};

serve(handler);
