import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createErrorResponse } from '../_shared/errorSanitizer.ts';
import { rateLimit, getRateLimitKey } from '../_shared/rateLimit.ts';

const stripe = new Stripe(
  Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_TEST_SECRET_KEY') || '',
  { apiVersion: '2023-10-16' }
);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // STEP 1: Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ code: 'unauthorized', message: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader }}}
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ code: 'unauthorized', message: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // STEP 2: Parse and validate input (only bookingId accepted, amount calculated server-side)
    const { bookingId, idempotencyKey } = await req.json();

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return new Response(
        JSON.stringify({ code: 'invalid_booking_id', message: 'Valid booking ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // STEP 3: Rate limiting (5 payment intents per user per hour)
    const rateLimitKey = getRateLimitKey(user.id, 'payment_intent');
    const allowed = await rateLimit(rateLimitKey, 5, 60 * 60);
    
    if (!allowed) {
      return new Response(
        JSON.stringify({ 
          code: 'rate_limited', 
          message: 'Too many payment requests. Please try again later.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // STEP 4: Use service role to fetch booking and calculate amount
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch booking with service details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        venue_id,
        party_size,
        service,
        status,
        guest_name,
        email
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('[create-payment-intent] Booking not found:', bookingId);
      return new Response(
        JSON.stringify({ code: 'booking_not_found', message: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Fetch service details to calculate amount
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('requires_payment, charge_amount_per_guest, minimum_guests_for_charge, title')
      .eq('venue_id', booking.venue_id)
      .eq('title', booking.service)
      .maybeSingle();

    if (serviceError) {
      console.error('[create-payment-intent] Service fetch error:', serviceError);
    }

    // STEP 5: Authorization check - user must be staff/admin of the booking's venue
    const { data: userVenue } = await supabase
      .from('profiles')
      .select('venue_id')
      .eq('id', user.id)
      .single();

    const isAuthorized = userVenue?.venue_id === booking.venue_id;

    if (!isAuthorized) {
      console.error('[create-payment-intent] Unauthorized:', { userId: user.id, bookingVenue: booking.venue_id, userVenue: userVenue?.venue_id });
      return new Response(
        JSON.stringify({ 
          code: 'forbidden', 
          message: 'You do not have permission to create payment for this booking' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // STEP 6: Calculate amount server-side (never trust client)
    let amountCents = 0;

    if (serviceData?.requires_payment) {
      const minimumForCharge = serviceData.minimum_guests_for_charge || 0;
      const chargeableGuests = Math.max(booking.party_size - minimumForCharge, 0);
      amountCents = chargeableGuests * (serviceData.charge_amount_per_guest || 0);
    }

    // Enforce bounds: £0.50 minimum, £1000 maximum
    if (amountCents < 50) {
      // Default to £10 if no payment configured
      amountCents = 1000;
    }
    
    if (amountCents > 100000) {
      return new Response(
        JSON.stringify({ 
          code: 'invalid_amount', 
          message: 'Payment amount out of acceptable range' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // STEP 7: Check if payment intent already exists for this booking
    const { data: existingPayment } = await supabase
      .from('booking_payments')
      .select('stripe_payment_intent_id, status')
      .eq('booking_id', bookingId)
      .in('status', ['pending', 'processing'])
      .maybeSingle();

    // If pending payment exists, retrieve that intent
    if (existingPayment?.stripe_payment_intent_id) {
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(
          existingPayment.stripe_payment_intent_id
        );
        
        console.log(`[create-payment-intent] Retrieved existing intent: ${existingIntent.id}`);
        
        return new Response(
          JSON.stringify({
            success: true,
            client_secret: existingIntent.client_secret,
            payment_intent_id: existingIntent.id,
            amount_cents: amountCents
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      } catch (retrieveError) {
        console.error('[create-payment-intent] Error retrieving existing intent:', retrieveError);
        // Continue to create new one if retrieval fails
      }
    }

    // STEP 8: Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: 'gbp',
        automatic_payment_methods: { enabled: true },
        description: `Booking #${bookingId} - ${serviceData?.title || booking.service}`,
        metadata: {
          booking_id: String(bookingId),
          venue_id: String(booking.venue_id),
          party_size: String(booking.party_size),
          guest_name: booking.guest_name
        },
        receipt_email: booking.email || undefined
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );

    // STEP 9: Record payment in database
    const { error: paymentError } = await supabase
      .from('booking_payments')
      .insert({
        booking_id: bookingId,
        venue_id: booking.venue_id,
        stripe_payment_intent_id: paymentIntent.id,
        amount_cents: amountCents,
        status: 'pending'
      });

    if (paymentError) {
      console.error('[create-payment-intent] Error recording payment:', paymentError);
      // Don't fail the request - payment intent is already created
    }

    // STEP 10: Update booking status to pending_payment
    await supabase
      .from('bookings')
      .update({ status: 'pending_payment' })
      .eq('id', bookingId);

    console.log(`[create-payment-intent] Created: ${paymentIntent.id} for booking ${bookingId}, amount: £${amountCents/100}`);

    return new Response(
      JSON.stringify({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount_cents: amountCents
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('[create-payment-intent] Error:', error);
    return createErrorResponse(error, 500, corsHeaders);
  }
};

serve(handler);
