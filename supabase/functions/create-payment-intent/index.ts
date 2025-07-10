
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { z } from "https://esm.sh/zod@3.23.8";
import { AdvancedRateLimiter, logSecurityEvent, detectThreatLevel } from "../../src/utils/securityUtils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced validation schema
const paymentIntentSchema = z.object({
  bookingId: z.number().int().positive("Invalid booking ID"),
  amount: z.number().positive().max(10000, "Amount too large"), // Max £100
  currency: z.string().length(3).default('gbp'),
  description: z.string().max(200, "Description too long").optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔒 Enhanced payment intent creation request received');

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Advanced rate limiting
    const clientId = AdvancedRateLimiter.getClientIdentifier(req);
    const threatLevel = detectThreatLevel(req, clientId);
    
    const rateLimitResult = await AdvancedRateLimiter.checkLimit(
      clientId,
      { windowMs: 15 * 60 * 1000, maxRequests: threatLevel === 'high' ? 3 : 10 },
      threatLevel
    );

    if (!rateLimitResult.allowed) {
      console.log('🚫 Payment rate limit exceeded for:', clientId);
      await logSecurityEvent(supabaseClient, 'data_access', {
        error: 'payment_rate_limit_exceeded',
        threat_level: threatLevel
      }, req);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: corsHeaders }
      );
    }

    // Validate and parse request
    let paymentData;
    try {
      const rawData = await req.json();
      paymentData = paymentIntentSchema.parse(rawData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        console.error('❌ Payment validation errors:', errors);
        await logSecurityEvent(supabaseClient, 'data_access', {
          error: 'payment_validation_failed',
          validation_errors: errors,
          threat_level: threatLevel
        }, req);
        return new Response(
          JSON.stringify({ error: 'Invalid payment data', details: errors }),
          { status: 400, headers: corsHeaders }
        );
      }
      throw error;
    }

    // Get and validate booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*, venues(*)')
      .eq('id', paymentData.bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('❌ Booking not found:', bookingError);
      await logSecurityEvent(supabaseClient, 'data_access', {
        error: 'booking_not_found',
        booking_id: paymentData.bookingId,
        threat_level: threatLevel
      }, req);
      throw new Error('Booking not found')
    }

    // Get venue's Stripe settings with enhanced validation
    const { data: stripeSettings } = await supabaseClient
      .from('venue_stripe_settings')
      .select('*')
      .eq('venue_id', booking.venue_id)
      .single()

    if (!stripeSettings?.is_active) {
      console.error('❌ Stripe payments not configured for venue:', booking.venue_id);
      await logSecurityEvent(supabaseClient, 'data_access', {
        error: 'stripe_not_configured',
        venue_id: booking.venue_id,
        threat_level: threatLevel
      }, req, booking.venue_id);
      throw new Error('Stripe payments not configured for this venue')
    }

    // Validate payment amount against expected amount
    // This should ideally be calculated based on service pricing
    if (paymentData.amount < 1 || paymentData.amount > 10000) { // £1 to £100
      console.error('❌ Invalid payment amount:', paymentData.amount);
      await logSecurityEvent(supabaseClient, 'data_access', {
        error: 'invalid_payment_amount',
        amount: paymentData.amount,
        booking_id: paymentData.bookingId,
        threat_level: threatLevel
      }, req, booking.venue_id);
      throw new Error('Invalid payment amount')
    }

    // Check for duplicate payment attempts
    const { data: existingPayment } = await supabaseClient
      .from('booking_payments')
      .select('id, status')
      .eq('booking_id', paymentData.bookingId)
      .single()

    if (existingPayment && existingPayment.status === 'succeeded') {
      console.log('⚠️ Payment already completed for booking:', paymentData.bookingId);
      return new Response(
        JSON.stringify({ error: 'Payment already completed for this booking' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('Stripe Secret Key') || '', {
      apiVersion: '2023-10-16',
    })

    // Create payment intent with enhanced metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(paymentData.amount * 100), // Convert to pence
      currency: paymentData.currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        booking_id: paymentData.bookingId.toString(),
        venue_id: booking.venue_id,
        guest_name: booking.guest_name,
        party_size: booking.party_size.toString(),
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        threat_level: threatLevel,
      },
      description: paymentData.description || `Payment for booking ${booking.booking_reference || paymentData.bookingId}`,
    })

    // Store or update payment record
    const paymentRecord = {
      booking_id: paymentData.bookingId,
      stripe_payment_intent_id: paymentIntent.id,
      amount_cents: Math.round(paymentData.amount * 100),
      status: 'pending',
    };

    if (existingPayment) {
      const { error: updateError } = await supabaseClient
        .from('booking_payments')
        .update(paymentRecord)
        .eq('id', existingPayment.id);
      
      if (updateError) {
        console.error('Failed to update payment record:', updateError);
      }
    } else {
      const { error: insertError } = await supabaseClient
        .from('booking_payments')
        .insert(paymentRecord);
      
      if (insertError) {
        console.error('Failed to store payment record:', insertError);
      }
    }

    // Log successful payment intent creation
    await logSecurityEvent(supabaseClient, 'data_access', {
      action: 'payment_intent_created',
      payment_intent_id: paymentIntent.id,
      booking_id: paymentData.bookingId,
      amount: paymentData.amount,
      threat_level: threatLevel,
      success: true
    }, req, booking.venue_id);

    console.log('✅ Payment intent created successfully:', paymentIntent.id);

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('💥 Error creating payment intent:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
