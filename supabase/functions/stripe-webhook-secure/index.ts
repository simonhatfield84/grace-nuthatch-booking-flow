
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

  console.log('🔒 Enhanced Stripe webhook received')
  
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  
  if (!signature) {
    console.error('❌ Missing Stripe signature')
    return new Response('Missing signature', { status: 200 }) // Return 200 to stop retries
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the webhook event first to get basic info
    let eventData: any
    let venueId: string | null = null
    
    try {
      eventData = JSON.parse(body)
      console.log('📋 Processing webhook event:', eventData.type, 'for object:', eventData.data?.object?.id)
      
      // Check for idempotency - if we've already processed this event, return success
      const { data: existingEvent } = await supabaseClient
        .from('webhook_events')
        .select('id, processing_status')
        .eq('stripe_event_id', eventData.id)
        .single()

      if (existingEvent) {
        console.log('ℹ️ Event already processed:', eventData.id, 'status:', existingEvent.processing_status)
        return new Response('Event already processed', { headers: corsHeaders })
      }

      // Get venue_id from payment intent metadata (primary source)
      if (eventData.data?.object?.metadata?.venue_id) {
        venueId = eventData.data.object.metadata.venue_id
        console.log('🎯 Found venue from payment intent metadata:', venueId)
      }
      // Also check charge metadata as fallback
      else if (eventData.data?.object?.charges?.data?.[0]?.metadata?.venue_id) {
        venueId = eventData.data.object.charges.data[0].metadata.venue_id
        console.log('🎯 Found venue from charge metadata:', venueId)
      }
      // Final fallback: lookup from booking_id
      else if (eventData.data?.object?.metadata?.booking_id || eventData.data?.object?.charges?.data?.[0]?.metadata?.booking_id) {
        const bookingId = eventData.data.object.metadata?.booking_id || eventData.data.object.charges.data[0].metadata.booking_id
        console.log('🔍 venue_id missing from metadata, looking up from booking_id:', bookingId)
        
        const { data: booking, error: bookingError } = await supabaseClient
          .from('bookings')
          .select('venue_id')
          .eq('id', bookingId)
          .single()
        
        if (booking && !bookingError) {
          venueId = booking.venue_id
          console.log('✅ Found venue_id from booking lookup:', venueId)
        } else {
          console.error('❌ Failed to lookup venue_id from booking:', bookingError)
          await logWebhookEvent(supabaseClient, eventData, null, 'failed', { error: 'Could not determine venue for booking', bookingId })
          return new Response('Could not determine venue', { status: 200 })
        }
      } else {
        console.error('❌ No venue_id or booking_id found in event metadata')
        console.log('📋 Event data structure:', JSON.stringify(eventData.data?.object?.metadata, null, 2))
        await logWebhookEvent(supabaseClient, eventData, null, 'failed', { error: 'Missing metadata' })
        return new Response('Missing metadata', { status: 200 })
      }
    } catch (parseError) {
      console.error('❌ Error parsing webhook event:', parseError)
      return new Response('Invalid event format', { status: 400 })
    }

    if (!venueId) {
      await logWebhookEvent(supabaseClient, eventData, null, 'failed', { error: 'Could not determine venue_id' })
      return new Response('Could not determine venue', { status: 200 })
    }

    // Get venue's webhook secret and settings
    const { data: stripeSettings, error: settingsError } = await supabaseClient
      .from('venue_stripe_settings')
      .select('webhook_secret_test, webhook_secret_live, test_mode')
      .eq('venue_id', venueId)
      .single()

    if (settingsError || !stripeSettings) {
      console.error('❌ Error fetching venue Stripe settings:', settingsError)
      await logWebhookEvent(supabaseClient, eventData, venueId, 'failed', { error: 'Venue Stripe settings not found' })
      return new Response('Venue settings not found', { status: 200 })
    }

    // Select the correct webhook secret based on test mode
    const webhookSecret = stripeSettings.test_mode 
      ? stripeSettings.webhook_secret_test 
      : stripeSettings.webhook_secret_live

    if (!webhookSecret) {
      const keyType = stripeSettings.test_mode ? 'test' : 'live'
      console.error(`❌ Missing ${keyType} webhook secret for venue:`, venueId)
      await logWebhookEvent(supabaseClient, eventData, venueId, 'failed', { error: `${keyType} webhook secret not configured` })
      return new Response('Webhook secret not configured', { status: 200 })
    }

    // Get the correct Stripe secret key
    const stripeKey = stripeSettings.test_mode
      ? Deno.env.get('STRIPE_TEST_SECRET_KEY')
      : Deno.env.get('STRIPE_SECRET_KEY')

    if (!stripeKey) {
      const keyType = stripeSettings.test_mode ? 'STRIPE_TEST_SECRET_KEY' : 'STRIPE_SECRET_KEY'
      console.error(`❌ Missing ${keyType} environment variable`)
      await logWebhookEvent(supabaseClient, eventData, venueId, 'failed', { error: `${keyType} not configured` })
      return new Response('Stripe key not configured', { status: 200 })
    }

    // Initialize Stripe with the correct key
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    // Verify the webhook signature (CRITICAL FIX: Use async version)
    let event: any
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
      console.log('✅ Webhook signature verified successfully')
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message)
      await logWebhookEvent(supabaseClient, eventData, venueId, 'failed', { error: 'Signature verification failed', details: err.message })
      return new Response('Invalid signature', { status: 200 }) // Return 200 to stop retries
    }

    // Log the webhook event as processing
    await logWebhookEvent(supabaseClient, event, venueId, 'processing')

    // Process the webhook event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentSuccess(event.data.object, supabaseClient, venueId)
          break
        
        case 'payment_intent.payment_failed':
          await handlePaymentFailed(event.data.object, supabaseClient, venueId)
          break
          
        default:
          console.log(`ℹ️ Unhandled webhook event type: ${event.type}`)
      }

      // Update webhook event as successful
      await updateWebhookEventStatus(supabaseClient, event.id, 'success')
      console.log('✅ Webhook processed successfully')

      return new Response('ok', { headers: corsHeaders })

    } catch (processingError) {
      console.error('❌ Error processing webhook event:', processingError)
      await updateWebhookEventStatus(supabaseClient, event.id, 'failed', { error: processingError.message })
      return new Response('Processing error', { status: 200 }) // Return 200 to stop retries
    }

  } catch (error) {
    console.error('💥 Webhook error:', error)
    
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 200, // Return 200 to stop retries
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handlePaymentSuccess(paymentIntent: any, supabaseClient: any, venueId: string) {
  // Get booking_id from payment intent metadata or charge metadata
  const bookingId = paymentIntent.metadata.booking_id || 
                   paymentIntent.charges?.data?.[0]?.metadata?.booking_id

  if (!bookingId) {
    console.error('❌ No booking_id found in payment intent or charge metadata')
    return
  }

  console.log('💰 Processing payment success:', paymentIntent.id, 'for booking:', bookingId)

  try {
    // Start transaction-like operation
    const now = new Date().toISOString()

    // Check if payment record already exists
    const { data: existingPayment } = await supabaseClient
      .from('booking_payments')
      .select('id, status')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single()

    if (existingPayment && existingPayment.status === 'succeeded') {
      console.log('ℹ️ Payment already processed successfully:', paymentIntent.id)
      return
    }

    // Create or update payment record
    if (existingPayment) {
      const { error: paymentError } = await supabaseClient
        .from('booking_payments')
        .update({
          status: 'succeeded',
          processed_at: now,
          payment_method_type: paymentIntent.charges?.data?.[0]?.payment_method_details?.type || 'unknown',
          updated_at: now
        })
        .eq('id', existingPayment.id)

      if (paymentError) {
        console.error('❌ Error updating payment record:', paymentError)
        throw paymentError
      } else {
        console.log('✅ Updated existing payment record to succeeded')
      }
    } else {
      // Create new payment record
      const { error: paymentError } = await supabaseClient
        .from('booking_payments')
        .insert({
          booking_id: parseInt(bookingId),
          stripe_payment_intent_id: paymentIntent.id,
          amount_cents: paymentIntent.amount,
          status: 'succeeded',
          processed_at: now,
          payment_method_type: paymentIntent.charges?.data?.[0]?.payment_method_details?.type || 'card',
          created_at: now,
          updated_at: now
        })

      if (paymentError) {
        console.error('❌ Error creating payment record:', paymentError)
        throw paymentError
      } else {
        console.log('✅ Created new payment record')
      }
    }

    // Update booking status to confirmed if not already
    const { data: booking } = await supabaseClient
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .single()

    if (booking && booking.status !== 'confirmed') {
      const { error: bookingError } = await supabaseClient
        .from('bookings')
        .update({ 
          status: 'confirmed',
          updated_at: now
        })
        .eq('id', bookingId)

      if (bookingError) {
        console.error('❌ Error updating booking status:', bookingError)
        throw bookingError
      } else {
        console.log('✅ Updated booking status to confirmed for booking:', bookingId)
      }
    } else {
      console.log('ℹ️ Booking already confirmed:', bookingId)
    }

    // Send confirmation email
    await sendBookingConfirmationEmail(bookingId, supabaseClient)

    console.log('💰 Payment succeeded processing complete:', paymentIntent.id)

  } catch (error) {
    console.error('❌ Error in handlePaymentSuccess:', error)
    throw error
  }
}

async function handlePaymentFailed(paymentIntent: any, supabaseClient: any, venueId: string) {
  const bookingId = paymentIntent.metadata.booking_id || 
                   paymentIntent.charges?.data?.[0]?.metadata?.booking_id

  if (!bookingId) {
    console.error('❌ No booking_id found in payment intent metadata')
    return
  }

  console.log('💳 Processing payment failure:', paymentIntent.id, 'for booking:', bookingId)

  try {
    const now = new Date().toISOString()

    // Update or create payment record
    const { error: paymentError } = await supabaseClient
      .from('booking_payments')
      .upsert({
        booking_id: parseInt(bookingId),
        stripe_payment_intent_id: paymentIntent.id,
        amount_cents: paymentIntent.amount,
        status: 'failed',
        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
        processed_at: now,
        payment_method_type: 'card',
        created_at: now,
        updated_at: now
      }, {
        onConflict: 'stripe_payment_intent_id'
      })

    if (paymentError) {
      console.error('❌ Error updating payment record:', paymentError)
      throw paymentError
    }

    // Update booking status to cancelled
    const { error: bookingError } = await supabaseClient
      .from('bookings')
      .update({ 
        status: 'cancelled',
        updated_at: now
      })
      .eq('id', bookingId)

    if (bookingError) {
      console.error('❌ Error updating booking status:', bookingError)
      throw bookingError
    }

    console.log('💳 Payment failure processing complete:', paymentIntent.id)

  } catch (error) {
    console.error('❌ Error in handlePaymentFailed:', error)
    throw error
  }
}

async function sendBookingConfirmationEmail(bookingId: number, supabaseClient: any) {
  try {
    console.log('📧 Attempting to send booking confirmation email for booking:', bookingId)

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('email, venue_id')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('❌ Error fetching booking for email:', bookingError)
      return
    }

    if (!booking.email) {
      console.log('ℹ️ No email address for booking, skipping email send')
      return
    }

    console.log('📧 Sending confirmation email to:', booking.email)

    // Send email using the send-email function
    const emailResponse = await supabaseClient.functions.invoke('send-email', {
      body: {
        booking_id: bookingId,
        guest_email: booking.email,
        venue_id: booking.venue_id,
        email_type: 'booking_confirmation'
      }
    })

    console.log('📧 Email function response:', emailResponse)

    if (emailResponse.error) {
      console.error('❌ Failed to send confirmation email:', emailResponse.error)
    } else {
      console.log('✅ Confirmation email sent successfully with ID:', emailResponse.data?.id)
    }

  } catch (error) {
    console.error('❌ Error sending confirmation email:', error)
  }
}

async function logWebhookEvent(supabaseClient: any, event: any, venueId: string | null, status: string, errorDetails?: any) {
  try {
    const bookingId = event.data?.object?.metadata?.booking_id || 
                     event.data?.object?.charges?.data?.[0]?.metadata?.booking_id

    await supabaseClient
      .from('webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        processing_status: status,
        venue_id: venueId,
        booking_id: bookingId ? parseInt(bookingId) : null,
        payment_intent_id: event.data?.object?.id,
        amount_cents: event.data?.object?.amount,
        error_details: errorDetails || null,
        raw_event_data: event,
        processed_at: status === 'success' ? new Date().toISOString() : null
      })

    console.log('📝 Webhook event logged:', event.id, 'status:', status)
  } catch (error) {
    console.error('❌ Error logging webhook event:', error)
  }
}

async function updateWebhookEventStatus(supabaseClient: any, eventId: string, status: string, errorDetails?: any) {
  try {
    await supabaseClient
      .from('webhook_events')
      .update({
        processing_status: status,
        error_details: errorDetails || null,
        processed_at: status === 'success' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_event_id', eventId)

    console.log('📝 Updated webhook event status:', eventId, 'to:', status)
  } catch (error) {
    console.error('❌ Error updating webhook event status:', error)
  }
}
