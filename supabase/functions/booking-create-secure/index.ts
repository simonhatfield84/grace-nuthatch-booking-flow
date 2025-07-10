
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingRequest {
  guest_name: string;
  email?: string;
  phone?: string;
  party_size: number;
  booking_date: string;
  booking_time: string;
  service?: string;
  notes?: string;
  venue_id: string;
}

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔒 Secure booking creation request received');

    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const currentTime = Date.now();
    const rateLimitWindow = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 10; // Max 10 bookings per 15 minutes per IP

    const clientLimit = rateLimitMap.get(clientIP);
    if (clientLimit) {
      if (currentTime < clientLimit.resetTime) {
        if (clientLimit.count >= maxRequests) {
          console.log('🚫 Rate limit exceeded for IP:', clientIP);
          return new Response('Rate limit exceeded', { 
            status: 429, 
            headers: corsHeaders 
          });
        }
        clientLimit.count++;
      } else {
        // Reset the limit
        rateLimitMap.set(clientIP, { count: 1, resetTime: currentTime + rateLimitWindow });
      }
    } else {
      rateLimitMap.set(clientIP, { count: 1, resetTime: currentTime + rateLimitWindow });
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

    // Parse and validate request body
    const bookingData: BookingRequest = await req.json();

    // Input validation
    const errors: string[] = [];

    if (!bookingData.guest_name || bookingData.guest_name.trim().length < 2) {
      errors.push('Guest name must be at least 2 characters');
    }

    if (bookingData.guest_name && bookingData.guest_name.length > 100) {
      errors.push('Guest name must be less than 100 characters');
    }

    if (!bookingData.party_size || bookingData.party_size < 1 || bookingData.party_size > 50) {
      errors.push('Party size must be between 1 and 50');
    }

    if (!bookingData.booking_date || !isValidDate(bookingData.booking_date)) {
      errors.push('Valid booking date is required');
    }

    if (!bookingData.booking_time || !isValidTime(bookingData.booking_time)) {
      errors.push('Valid booking time is required');
    }

    if (!bookingData.venue_id || !isValidUUID(bookingData.venue_id)) {
      errors.push('Valid venue ID is required');
    }

    if (bookingData.email && !isValidEmail(bookingData.email)) {
      errors.push('Valid email address is required');
    }

    if (bookingData.phone && !isValidPhone(bookingData.phone)) {
      errors.push('Valid phone number is required');
    }

    if (bookingData.notes && bookingData.notes.length > 500) {
      errors.push('Notes must be less than 500 characters');
    }

    if (errors.length > 0) {
      console.error('❌ Validation errors:', errors);
      return new Response(JSON.stringify({ errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Sanitize input data
    const sanitizedData = {
      guest_name: sanitizeString(bookingData.guest_name),
      email: bookingData.email ? sanitizeEmail(bookingData.email) : null,
      phone: bookingData.phone ? sanitizePhone(bookingData.phone) : null,
      party_size: Math.floor(bookingData.party_size),
      booking_date: bookingData.booking_date,
      booking_time: bookingData.booking_time,
      service: bookingData.service ? sanitizeString(bookingData.service) : 'Dinner',
      notes: bookingData.notes ? sanitizeString(bookingData.notes) : null,
      venue_id: bookingData.venue_id,
    };

    // Verify venue exists and is approved
    const { data: venue, error: venueError } = await supabaseAdmin
      .from('venues')
      .select('id, approval_status')
      .eq('id', sanitizedData.venue_id)
      .single();

    if (venueError || !venue) {
      console.error('❌ Venue not found:', venueError);
      return new Response('Venue not found', { status: 404, headers: corsHeaders });
    }

    if (venue.approval_status !== 'approved') {
      console.error('❌ Venue not approved:', venue.approval_status);
      return new Response('Venue not available for bookings', { status: 403, headers: corsHeaders });
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert(sanitizedData)
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Booking creation error:', bookingError);
      throw new Error('Failed to create booking');
    }

    // Log security audit event
    await supabaseAdmin
      .from('security_audit')
      .insert({
        venue_id: sanitizedData.venue_id,
        event_type: 'booking_created',
        event_details: {
          booking_id: booking.id,
          party_size: sanitizedData.party_size,
          booking_date: sanitizedData.booking_date,
          client_ip: clientIP,
        },
        ip_address: clientIP,
        user_agent: req.headers.get('user-agent'),
      });

    console.log('✅ Booking created successfully:', booking.id);
    return new Response(JSON.stringify({ booking }), {
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

// Validation helper functions
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}

function isValidTime(timeString: string): boolean {
  return timeString.match(/^\d{2}:\d{2}$/) !== null;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
  return phoneRegex.test(phone);
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Sanitization helper functions
function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d\s\-\+\(\)]/g, '').trim();
}

serve(handler);
