
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bookingId, amount, currency = 'gbp' } = await req.json()

    if (!bookingId || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*, venues(stripe_settings:venue_stripe_settings(*))')
      .eq('id', bookingId)
      .single()

    if (bookingError) {
      throw new Error('Booking not found')
    }

    // Get venue's Stripe settings
    const { data: stripeSettings, error: stripeError } = await supabaseClient
      .from('venue_stripe_settings')
      .select('*')
      .eq('venue_id', booking.venue_id)
      .single()

    if (stripeError || !stripeSettings?.stripe_account_id) {
      throw new Error('Venue Stripe settings not configured')
    }

    // Initialize Stripe (you'll need to add Stripe secret key to secrets)
    const stripe = new (await import('https://esm.sh/stripe@13.11.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') ?? '',
      { apiVersion: '2023-10-16' }
    )

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to pence
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        booking_id: bookingId.toString(),
        venue_id: booking.venue_id,
        guest_name: booking.guest_name,
        party_size: booking.party_size.toString(),
      },
      // Connect to venue's Stripe account
      ...(stripeSettings.stripe_account_id && {
        transfer_data: {
          destination: stripeSettings.stripe_account_id,
        },
      }),
    })

    // Store payment record
    const { error: paymentError } = await supabaseClient
      .from('booking_payments')
      .insert({
        booking_id: bookingId,
        stripe_payment_intent_id: paymentIntent.id,
        amount_cents: Math.round(amount * 100),
        status: 'pending',
      })

    if (paymentError) {
      console.error('Failed to store payment record:', paymentError)
    }

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
    console.error('Error creating payment intent:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
