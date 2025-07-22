
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

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const { payment_intent_id, test_mode = true } = await req.json()
    
    if (!payment_intent_id) {
      return new Response(
        JSON.stringify({ error: 'payment_intent_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 Testing webhook for payment intent:', payment_intent_id);
    console.log('🧪 Test mode:', test_mode);

    // Get the appropriate Stripe key
    const stripeKey = test_mode ? 
      Deno.env.get('STRIPE_TEST_SECRET_KEY') : 
      Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeKey) {
      const keyName = test_mode ? 'STRIPE_TEST_SECRET_KEY' : 'STRIPE_SECRET_KEY';
      console.error(`❌ ${keyName} not configured`);
      return new Response(
        JSON.stringify({ error: `${keyName} not configured` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16'
    })

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    console.log('💳 Payment Intent retrieved:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata
    });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if we have a booking payment record
    const { data: bookingPayment, error: paymentError } = await supabaseClient
      .from('booking_payments')
      .select('*')
      .eq('stripe_payment_intent_id', payment_intent_id)
      .single()

    console.log('📊 Booking payment record:', bookingPayment);
    if (paymentError && paymentError.code !== 'PGRST116') {
      console.error('❌ Error fetching booking payment:', paymentError);
    }

    // If payment is succeeded but not updated in our DB, simulate webhook processing
    if (paymentIntent.status === 'succeeded' && bookingPayment?.status !== 'succeeded') {
      console.log('🔄 Payment succeeded but not updated in DB - simulating webhook processing');
      
      const bookingId = paymentIntent.metadata.booking_id;
      if (bookingId) {
        // Update payment status
        const { error: paymentUpdateError } = await supabaseClient
          .from('booking_payments')
          .update({
            status: 'succeeded',
            payment_method_type: paymentIntent.payment_method_types?.[0] || null,
            processed_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', payment_intent_id)

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
        }
      }
    }

    return new Response(
      JSON.stringify({
        payment_intent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata
        },
        booking_payment: bookingPayment,
        webhook_simulation: paymentIntent.status === 'succeeded' && bookingPayment?.status !== 'succeeded'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('💥 Webhook test error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
