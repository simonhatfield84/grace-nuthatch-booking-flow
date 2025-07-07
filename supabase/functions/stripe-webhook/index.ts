
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return new Response('No signature', { status: 400 })
    }

    // Initialize Stripe
    const stripe = new (await import('https://esm.sh/stripe@13.11.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') ?? '',
      { apiVersion: '2023-10-16' }
    )

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    )

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Webhook event type:', event.type)

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        const bookingId = paymentIntent.metadata.booking_id

        if (bookingId) {
          // Update payment status
          await supabaseClient
            .from('booking_payments')
            .update({
              status: 'succeeded',
              payment_method_type: paymentIntent.payment_method_types?.[0] || null,
            })
            .eq('stripe_payment_intent_id', paymentIntent.id)

          console.log(`Payment succeeded for booking ${bookingId}`)
        }
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object
        const failedBookingId = failedPayment.metadata.booking_id

        if (failedBookingId) {
          // Update payment status
          await supabaseClient
            .from('booking_payments')
            .update({
              status: 'failed',
              failure_reason: failedPayment.last_payment_error?.message || 'Payment failed',
            })
            .eq('stripe_payment_intent_id', failedPayment.id)

          console.log(`Payment failed for booking ${failedBookingId}`)
        }
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
