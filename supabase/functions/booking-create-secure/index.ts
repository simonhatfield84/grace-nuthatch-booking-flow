
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { z } from "https://esm.sh/zod@3.23.8";
import { AdvancedRateLimiter, sanitizeInput, sanitizeEmail, sanitizePhone, logSecurityEvent, detectThreatLevel } from "../../src/utils/securityUtils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
