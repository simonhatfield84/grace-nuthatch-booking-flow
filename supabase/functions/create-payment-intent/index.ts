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

    // Initialize Stripe
    const stripe = new Stripe(
      Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_TEST_SECRET_KEY') || '',
      { apiVersion: '2023-10-16' }
    )

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

    console.log('Payment intent created:', paymentIntent.id)

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
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
