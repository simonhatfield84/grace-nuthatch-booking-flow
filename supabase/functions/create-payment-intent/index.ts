
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { bookingId, amount, currency = 'gbp', description, metadata = {} } = await req.json();

    console.log('Creating payment intent:', { bookingId, amount, currency, description });

    // Get booking details to determine venue
    const { data: booking } = await supabase
      .from('bookings')
      .select('venue_id')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Get venue Stripe settings
    const { data: stripeSettings } = await supabase
      .from('venue_stripe_settings')
      .select('*')
      .eq('venue_id', booking.venue_id)
      .single();

    if (!stripeSettings?.is_active) {
      throw new Error('Payment processing not configured for this venue');
    }

    // Create payment intent using Stripe API
    const stripeSecretKey = stripeSettings.test_mode 
      ? Deno.env.get('STRIPE_TEST_SECRET_KEY')
      : Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      throw new Error('Stripe configuration missing');
    }

    const paymentIntentData = {
      amount: Math.round(amount), // Ensure amount is integer
      currency: currency.toLowerCase(),
      description,
      metadata: {
        booking_id: bookingId.toString(),
        venue_id: booking.venue_id,
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true
      }
    };

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: paymentIntentData.amount.toString(),
        currency: paymentIntentData.currency,
        description: paymentIntentData.description || '',
        'metadata[booking_id]': paymentIntentData.metadata.booking_id,
        'metadata[venue_id]': paymentIntentData.metadata.venue_id,
        'automatic_payment_methods[enabled]': 'true'
      }).toString()
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Stripe API error:', error);
      throw new Error('Failed to create payment intent');
    }

    const paymentIntent = await response.json();
    console.log('Payment intent created:', paymentIntent.id);

    // Store payment record in database
    const { error: dbError } = await supabase
      .from('booking_payments')
      .insert([{
        booking_id: bookingId,
        amount_cents: amount,
        status: 'pending',
        stripe_payment_intent_id: paymentIntent.id,
        payment_method_type: null
      }]);

    if (dbError) {
      console.error('Database error:', dbError);
      // Don't throw error here as payment intent is already created
    }

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
