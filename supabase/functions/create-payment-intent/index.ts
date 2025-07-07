
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bookingId, amount, currency = 'gbp', description } = await req.json()

    if (!bookingId || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: bookingId, amount' }),
        { status: 400, headers: corsHeaders }
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
      .select('*, venues(*)')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      throw new Error('Booking not found')
    }

    // Get venue's Stripe settings
    const { data: stripeSettings } = await supabaseClient
      .from('venue_stripe_settings')
      .select('*')
      .eq('venue_id', booking.venue_id)
      .single()

    if (!stripeSettings?.is_active) {
      throw new Error('Stripe payments not configured for this venue')
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('Stripe Secret Key') || '', {
      apiVersion: '2023-10-16',
    })

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
      description: description || `Payment for booking ${booking.booking_reference || bookingId}`,
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
