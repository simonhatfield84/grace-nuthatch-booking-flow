import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createErrorResponse } from '../_shared/errorSanitizer.ts';
import { rateLimit, getRateLimitKey } from '../_shared/rateLimit.ts';
import { ok, err, jsonResponse } from '../_shared/apiResponse.ts';

const stripe = new Stripe(
  Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_TEST_SECRET_KEY') || '',
  { apiVersion: '2023-10-16' }
);

const handler = async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const reqId = crypto.randomUUID().substring(0, 8);
    console.log(`💳 [${reqId}] Payment intent request`);
    
    // Parse input
    const { bookingId } = await req.json();

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return jsonResponse(
        err('invalid_input', 'Valid booking ID required'),
        400,
        corsHeaders
      );
    }

    // STEP 1: Use service role to fetch booking (anonymous-safe)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        venue_id,
        party_size,
        service,
        status,
        guest_name,
        email,
        venues!inner(slug)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error(`❌ [${reqId}] Booking not found:`, bookingId);
      return jsonResponse(
        err('not_found', 'Booking not found'),
        404,
        corsHeaders
      );
    }

    // STEP 2: Verify booking is pending_payment
    if (booking.status !== 'pending_payment') {
      console.error(`❌ [${reqId}] Booking not pending payment:`, booking.status);
      return jsonResponse(
        err('invalid_state', 'Booking does not require payment or has already been paid'),
        400,
        corsHeaders
      );
    }

    // STEP 3: Rate limiting (10 payment intents per booking)
    const rateLimitKey = getRateLimitKey(`booking:${bookingId}`, 'payment_intent');
    const allowed = await rateLimit(rateLimitKey, 10, 60 * 60);
    
    if (!allowed) {
      return jsonResponse(
        err('rate_limited', 'Too many payment requests. Please try again later.'),
        429,
        corsHeaders
      );
    }

    // STEP 4: Get service and calculate amount SERVER-SIDE
    const venueSlug = booking.venues.slug;
    
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('id, requires_payment, charge_amount_per_guest, minimum_guests_for_charge, title')
      .eq('venue_id', booking.venue_id)
      .eq('title', booking.service)
      .maybeSingle();

    if (serviceError) {
      console.error(`❌ [${reqId}] Service fetch error:`, serviceError);
    }

    // Calculate amount using venue-payment-rules
    const { data: paymentCalc } = await supabase.functions.invoke('venue-payment-rules', {
      body: {
        venueSlug: venueSlug,
        serviceId: serviceData?.id,
        partySize: booking.party_size
      }
    });

    if (!paymentCalc?.ok || !paymentCalc.shouldCharge || paymentCalc.amount_cents <= 0) {
      console.error(`❌ [${reqId}] Payment not required for this booking`);
      return jsonResponse(
        err('invalid_state', 'Payment not required for this booking'),
        400,
        corsHeaders
      );
    }

    const amountCents = paymentCalc.amount_cents;
    console.log(`💰 [${reqId}] Amount calculated: £${amountCents/100}`);

    // Enforce bounds
    if (amountCents < 50 || amountCents > 1000000) {
      return jsonResponse(
        err('invalid_input', 'Payment amount out of acceptable range'),
        400,
        corsHeaders
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
        
        return jsonResponse(
          ok({
            success: true,
            client_secret: existingIntent.client_secret,
            payment_intent_id: existingIntent.id,
            amount_cents: amountCents
          }),
          200,
          corsHeaders
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

    return jsonResponse(
      ok({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount_cents: amountCents
      }),
      200,
      corsHeaders
    );

  } catch (error) {
    console.error('[create-payment-intent] Error:', error);
    return createErrorResponse(error, 500, corsHeaders);
  }
};

serve(handler);
