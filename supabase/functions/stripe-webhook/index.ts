
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('🔔 Webhook received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    console.log('📝 Webhook body length:', body.length);
    console.log('🔑 Stripe signature present:', !!signature);

    if (!signature) {
      console.error('❌ No signature found in request');
      return new Response('No signature', { status: 400, headers: corsHeaders })
    }

    // Parse the event first to determine if it's test or live
    let eventData;
    try {
      eventData = JSON.parse(body);
    } catch (parseError) {
      console.error('❌ Failed to parse webhook body:', parseError);
      return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
    }

    // Determine if this is a test event (test events have livemode: false)
    const isTestMode = eventData.livemode === false;
    console.log('🧪 Event mode detected:', isTestMode ? 'TEST' : 'LIVE');

    // Get the appropriate secrets
    const stripeSecretKey = isTestMode ? 
      Deno.env.get('STRIPE_TEST_SECRET_KEY') : 
      Deno.env.get('STRIPE_SECRET_KEY');
    
    const webhookSecret = isTestMode ? 
      Deno.env.get('STRIPE_TEST_WEBHOOK_SECRET') : 
      Deno.env.get('STRIPE_WEBHOOK_SECRET');

    console.log('🔐 Using secrets for:', isTestMode ? 'TEST' : 'LIVE');
    console.log('🔑 Stripe secret key configured:', !!stripeSecretKey);
    console.log('🔐 Webhook secret configured:', !!webhookSecret);

    if (!stripeSecretKey) {
      console.error(`❌ ${isTestMode ? 'STRIPE_TEST_SECRET_KEY' : 'STRIPE_SECRET_KEY'} not configured`);
      return new Response('Stripe secret key not configured', { status: 500, headers: corsHeaders });
    }

    if (!webhookSecret) {
      console.error(`❌ ${isTestMode ? 'STRIPE_TEST_WEBHOOK_SECRET' : 'STRIPE_WEBHOOK_SECRET'} not configured`);
      return new Response('Webhook secret not configured', { status: 500, headers: corsHeaders });
    }

    // Initialize Stripe with the appropriate key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    })

    let event
    try {
      // Use the async version for Deno compatibility
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
      console.log('✅ Webhook signature verified successfully');
      console.log('📋 Event type:', event.type);
      console.log('🆔 Event ID:', event.id);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return new Response(`Webhook Error: ${err.message}`, { status: 400, headers: corsHeaders })
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('📊 Processing webhook event:', event.type);

    // Store webhook event for debugging
    try {
      await supabaseClient
        .from('webhook_events')
        .insert({
          stripe_event_id: event.id,
          event_type: event.type,
          test_mode: isTestMode,
          processed_at: new Date().toISOString(),
          event_data: event.data
        });
      console.log('📝 Webhook event logged for debugging');
    } catch (logError) {
      console.error('⚠️ Failed to log webhook event (non-critical):', logError);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        const bookingId = paymentIntent.metadata.booking_id

        console.log('💰 Payment succeeded for booking:', bookingId);
        console.log('💳 Payment Intent ID:', paymentIntent.id);
        console.log('🧪 Test mode:', isTestMode);
        console.log('💵 Amount:', paymentIntent.amount, paymentIntent.currency);

        if (bookingId) {
          // Update payment status
          const { error: paymentUpdateError } = await supabaseClient
            .from('booking_payments')
            .update({
              status: 'succeeded',
              payment_method_type: paymentIntent.payment_method_types?.[0] || null,
              processed_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', paymentIntent.id)

          if (paymentUpdateError) {
            console.error('❌ Error updating payment status:', paymentUpdateError);
          } else {
            console.log('✅ Payment status updated to succeeded');
          }

          // Update booking status to confirmed
          const { error: bookingUpdateError } = await supabaseClient
            .from('bookings')
            .update({
              status: 'confirmed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', bookingId)

          if (bookingUpdateError) {
            console.error('❌ Error updating booking status:', bookingUpdateError);
          } else {
            console.log('✅ Booking status updated to confirmed');
          }

          // Get booking details for email
          const { data: booking, error: bookingError } = await supabaseClient
            .from('bookings')
            .select('email, venue_id')
            .eq('id', bookingId)
            .single();

          if (booking?.email && !bookingError) {
            console.log('📧 Sending confirmation email to:', booking.email);
            try {
              const { error: emailError } = await supabaseClient.functions.invoke('send-email', {
                body: {
                  booking_id: bookingId,
                  guest_email: booking.email,
                  venue_id: booking.venue_id,
                  email_type: 'booking_confirmation'
                }
              });

              if (emailError) {
                console.error('❌ Error sending confirmation email:', emailError);
              } else {
                console.log('✅ Confirmation email sent successfully');
              }
            } catch (emailErr) {
              console.error('❌ Exception sending confirmation email:', emailErr);
            }
          } else {
            console.log('ℹ️ No email found for booking, skipping email send');
          }
        }
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object
        const failedBookingId = failedPayment.metadata.booking_id

        console.log('❌ Payment failed for booking:', failedBookingId);
        console.log('💳 Payment Intent ID:', failedPayment.id);
        console.log('🧪 Test mode:', isTestMode);
        console.log('💸 Failed amount:', failedPayment.amount, failedPayment.currency);

        if (failedBookingId) {
          // Update payment status
          const { error: paymentUpdateError } = await supabaseClient
            .from('booking_payments')
            .update({
              status: 'failed',
              failure_reason: failedPayment.last_payment_error?.message || 'Payment failed',
              processed_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', failedPayment.id)

          if (paymentUpdateError) {
            console.error('❌ Error updating failed payment status:', paymentUpdateError);
          } else {
            console.log('✅ Payment status updated to failed');
          }

          console.log('❌ Payment failed for booking:', failedBookingId);
        }
        break

      default:
        console.log(`📋 Unhandled event type: ${event.type}`);
    }

    console.log('✅ Webhook processed successfully');
    return new Response(JSON.stringify({ 
      received: true, 
      event_id: event.id, 
      event_type: event.type,
      test_mode: isTestMode 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('💥 Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
