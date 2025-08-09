
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
    const { bookingId } = await req.json()

    if (!bookingId) {
      throw new Error('bookingId is required')
    }

    console.log('🔄 Manual payment reconciliation for booking:', bookingId)

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      throw new Error(`Booking ${bookingId} not found: ${bookingError?.message}`)
    }

    console.log('📋 Found booking:', {
      id: booking.id,
      status: booking.status,
      guest_name: booking.guest_name,
      venue_id: booking.venue_id
    })

    // Get venue Stripe settings
    const { data: stripeSettings, error: stripeError } = await supabaseClient
      .from('venue_stripe_settings')
      .select('test_mode')
      .eq('venue_id', booking.venue_id)
      .single()

    if (stripeError || !stripeSettings) {
      throw new Error(`Stripe settings not found for venue: ${stripeError?.message}`)
    }

    // Initialize Stripe with correct key
    const stripeKey = stripeSettings.test_mode
      ? Deno.env.get('STRIPE_TEST_SECRET_KEY')
      : Deno.env.get('STRIPE_SECRET_KEY')

    const stripe = new Stripe(stripeKey!, { apiVersion: '2023-10-16' })

    // Search for payment intents with this booking ID
    console.log('🔍 Searching for payment intents with booking_id:', bookingId)
    
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 10
    })

    let foundPayment = null
    for (const pi of paymentIntents.data) {
      if (pi.metadata.booking_id === bookingId.toString() && pi.status === 'succeeded') {
        foundPayment = pi
        break
      }
    }

    if (!foundPayment) {
      throw new Error(`No successful payment found for booking ${bookingId}`)
    }

    console.log('💰 Found successful payment:', foundPayment.id, 'amount:', foundPayment.amount)

    // Check if payment record already exists
    const { data: existingPayment } = await supabaseClient
      .from('booking_payments')
      .select('*')
      .eq('booking_id', bookingId)
      .single()

    if (!existingPayment) {
      // Create payment record
      const { error: paymentInsertError } = await supabaseClient
        .from('booking_payments')
        .insert({
          booking_id: bookingId,
          stripe_payment_intent_id: foundPayment.id,
          amount_cents: foundPayment.amount,
          status: 'succeeded',
          processed_at: new Date(foundPayment.created * 1000).toISOString(),
          payment_method_type: foundPayment.charges?.data?.[0]?.payment_method_details?.type || 'card'
        })

      if (paymentInsertError) {
        console.error('❌ Error creating payment record:', paymentInsertError)
      } else {
        console.log('✅ Created payment record')
      }
    } else {
      // Update existing payment record
      const { error: paymentUpdateError } = await supabaseClient
        .from('booking_payments')
        .update({
          status: 'succeeded',
          processed_at: new Date(foundPayment.created * 1000).toISOString()
        })
        .eq('booking_id', bookingId)

      if (paymentUpdateError) {
        console.error('❌ Error updating payment record:', paymentUpdateError)
      } else {
        console.log('✅ Updated payment record')
      }
    }

    // Update booking status to confirmed
    const { error: bookingUpdateError } = await supabaseClient
      .from('bookings')
      .update({ 
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (bookingUpdateError) {
      console.error('❌ Error updating booking status:', bookingUpdateError)
    } else {
      console.log('✅ Updated booking status to confirmed')
    }

    // Send confirmation email if booking has email
    if (booking.email) {
      console.log('📧 Sending confirmation email to:', booking.email)
      
      const emailResponse = await supabaseClient.functions.invoke('send-email', {
        body: {
          booking_id: bookingId,
          guest_email: booking.email,
          venue_id: booking.venue_id,
          email_type: 'booking_confirmation'
        }
      })

      if (emailResponse.error) {
        console.error('❌ Failed to send confirmation email:', emailResponse.error)
      } else {
        console.log('✅ Confirmation email sent successfully')
      }
    }

    console.log('🎉 Payment reconciliation completed successfully for booking:', bookingId)

    return new Response(JSON.stringify({
      success: true,
      bookingId: bookingId,
      paymentIntentId: foundPayment.id,
      amount: foundPayment.amount,
      status: 'reconciled'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Reconciliation error:', error)
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
