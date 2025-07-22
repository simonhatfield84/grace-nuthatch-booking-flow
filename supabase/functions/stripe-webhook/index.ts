
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  console.log('🔔 Stripe webhook received')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    
    // Initialize Stripe with the appropriate key based on the webhook
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const stripeTestSecretKey = Deno.env.get('STRIPE_TEST_SECRET_KEY')
    
    if (!stripeSecretKey && !stripeTestSecretKey) {
      throw new Error('Missing Stripe secret keys')
    }

    // Try live key first, fallback to test key
    let stripe: Stripe
    let webhookSecret: string | undefined
    
    try {
      stripe = new Stripe(stripeSecretKey!, { apiVersion: '2023-10-16' })
      webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    } catch (error) {
      stripe = new Stripe(stripeTestSecretKey!, { apiVersion: '2023-10-16' })
      webhookSecret = Deno.env.get('STRIPE_TEST_WEBHOOK_SECRET')
    }

    if (!webhookSecret) {
      console.log('⚠️ No webhook secret found, skipping signature verification')
    }

    let event: Stripe.Event
    
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
        console.log('✅ Webhook signature verified')
      } catch (err) {
        console.error('❌ Webhook signature verification failed:', err)
        return new Response(`Webhook signature verification failed: ${err}`, { 
          status: 400,
          headers: corsHeaders 
        })
      }
    } else {
      event = JSON.parse(body)
      console.log('⚠️ Processing webhook without signature verification')
    }

    console.log('📋 Processing webhook event:', {
      type: event.type,
      id: event.id,
      created: new Date(event.created * 1000).toISOString()
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(supabaseClient, event.data.object as Stripe.PaymentIntent)
        break
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(supabaseClient, event.data.object as Stripe.PaymentIntent)
        break
        
      case 'payment_intent.canceled':
        await handlePaymentCanceled(supabaseClient, event.data.object as Stripe.PaymentIntent)
        break

      default:
        console.log(`🔄 Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response(`Webhook error: ${error.message}`, { 
      status: 400,
      headers: corsHeaders 
    })
  }
})

async function handlePaymentSuccess(supabaseClient: any, paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.booking_id

  if (!bookingId) {
    console.error('❌ No booking_id in payment_intent metadata')
    return
  }

  console.log('✅ Payment succeeded for booking:', bookingId)

  // Update booking status to confirmed
  const { error: bookingError } = await supabaseClient
    .from('bookings')
    .update({ 
      status: 'confirmed',
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)

  if (bookingError) {
    console.error('❌ Failed to update booking:', bookingError)
    return
  }

  // Update payment record
  const { error: paymentError } = await supabaseClient
    .from('booking_payments')
    .update({ 
      status: 'succeeded',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  if (paymentError) {
    console.error('❌ Failed to update payment record:', paymentError)
  }

  // Get booking details for analytics
  const { data: booking } = await supabaseClient
    .from('bookings')
    .select('venue_id, party_size, service')
    .eq('id', bookingId)
    .single()

  if (booking) {
    // Log payment success analytics
    await supabaseClient
      .from('payment_analytics')
      .insert({
        booking_id: parseInt(bookingId),
        venue_id: booking.venue_id,
        event_type: 'payment_completed',
        event_data: {
          amount_cents: paymentIntent.amount,
          currency: paymentIntent.currency,
          payment_method: paymentIntent.payment_method_types?.[0],
          party_size: booking.party_size,
          service: booking.service
        }
      })
  }

  console.log('✅ Payment success handling completed')
}

async function handlePaymentFailure(supabaseClient: any, paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.booking_id

  if (!bookingId) {
    console.error('❌ No booking_id in payment_intent metadata')
    return
  }

  console.log('❌ Payment failed for booking:', bookingId)

  // Update booking status to payment_failed
  const { error: bookingError } = await supabaseClient
    .from('bookings')
    .update({ 
      status: 'payment_failed',
      cancellation_reason: 'payment_declined',
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)

  if (bookingError) {
    console.error('❌ Failed to update booking:', bookingError)
    return
  }

  // Update payment record
  const { error: paymentError } = await supabaseClient
    .from('booking_payments')
    .update({ 
      status: 'failed',
      failure_reason: paymentIntent.last_payment_error?.message || 'Payment declined',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  if (paymentError) {
    console.error('❌ Failed to update payment record:', paymentError)
  }

  // Get booking details for analytics
  const { data: booking } = await supabaseClient
    .from('bookings')
    .select('venue_id, party_size, service')
    .eq('id', bookingId)
    .single()

  if (booking) {
    // Log payment failure analytics
    await supabaseClient
      .from('payment_analytics')
      .insert({
        booking_id: parseInt(bookingId),
        venue_id: booking.venue_id,
        event_type: 'payment_failed',
        event_data: {
          failure_reason: paymentIntent.last_payment_error?.message || 'Payment declined',
          failure_code: paymentIntent.last_payment_error?.code,
          amount_cents: paymentIntent.amount,
          currency: paymentIntent.currency,
          party_size: booking.party_size,
          service: booking.service
        }
      })
  }

  console.log('✅ Payment failure handling completed')
}

async function handlePaymentCanceled(supabaseClient: any, paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.booking_id

  if (!bookingId) {
    console.error('❌ No booking_id in payment_intent metadata')
    return
  }

  console.log('🚫 Payment canceled for booking:', bookingId)

  // Update booking status to payment_failed (user canceled)
  const { error: bookingError } = await supabaseClient
    .from('bookings')
    .update({ 
      status: 'payment_failed',
      cancellation_reason: 'payment_canceled',
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)

  if (bookingError) {
    console.error('❌ Failed to update booking:', bookingError)
    return
  }

  // Update payment record
  const { error: paymentError } = await supabaseClient
    .from('booking_payments')
    .update({ 
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  if (paymentError) {
    console.error('❌ Failed to update payment record:', paymentError)
  }

  console.log('✅ Payment cancellation handling completed')
}
