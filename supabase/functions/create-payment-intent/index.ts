
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      bookingId, 
      amount, 
      currency = 'gbp', 
      description,
      existing_payment_intent_id 
    } = await req.json()

    console.log('Creating payment intent:', {
      bookingId,
      amount,
      currency,
      description,
      existing_payment_intent_id
    })

    // Initialize Supabase client to get venue settings
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get venue ID from booking
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('venue_id')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError)
      throw new Error('Booking not found')
    }

    console.log('Found booking venue_id:', booking.venue_id)

    // Get venue's Stripe settings to determine which key to use
    const { data: stripeSettings, error: stripeError } = await supabaseClient
      .from('venue_stripe_settings')
      .select('test_mode, is_active')
      .eq('venue_id', booking.venue_id)
      .single()

    if (stripeError || !stripeSettings) {
      console.error('Error fetching stripe settings:', stripeError)
      throw new Error('Venue Stripe settings not found')
    }

    if (!stripeSettings.is_active) {
      console.error('Stripe not active for venue:', booking.venue_id)
      throw new Error('Payment processing is not enabled for this venue')
    }

    console.log('Venue Stripe settings:', {
      test_mode: stripeSettings.test_mode,
      is_active: stripeSettings.is_active
    })

    // Dynamically select the correct Stripe key based on venue's test mode
    let stripeKey: string
    if (stripeSettings.test_mode) {
      stripeKey = Deno.env.get('STRIPE_TEST_SECRET_KEY') || ''
      console.log('Using TEST Stripe key for venue in test mode')
    } else {
      stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
      console.log('Using LIVE Stripe key for venue in live mode')
    }

    if (!stripeKey) {
      const keyType = stripeSettings.test_mode ? 'STRIPE_TEST_SECRET_KEY' : 'STRIPE_SECRET_KEY'
      console.error(`Missing ${keyType} environment variable`)
      throw new Error(`${keyType} not configured`)
    }

    // Initialize Stripe with the correct key
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    // If we have an existing payment intent ID, retrieve it
    if (existing_payment_intent_id) {
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(existing_payment_intent_id)
        console.log('Retrieved existing payment intent:', existingIntent.id)
        
        return new Response(
          JSON.stringify({
            success: true,
            client_secret: existingIntent.client_secret,
            payment_intent_id: existingIntent.id
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } catch (retrieveError) {
        console.error('Error retrieving existing payment intent:', retrieveError)
        // Continue to create a new one if retrieval fails
      }
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      description: description,
      metadata: {
        booking_id: bookingId,
      }
    })

    console.log('Payment intent created successfully:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      test_mode: stripeSettings.test_mode
    })

    return new Response(
      JSON.stringify({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Create payment intent error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create payment intent'
    if (error.message.includes('api_key_expired')) {
      errorMessage = 'Payment system configuration error. Please contact the venue.'
    } else if (error.message.includes('not configured')) {
      errorMessage = 'Payment system not properly configured'
    } else if (error.message.includes('not found')) {
      errorMessage = error.message
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: error.toString()
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
