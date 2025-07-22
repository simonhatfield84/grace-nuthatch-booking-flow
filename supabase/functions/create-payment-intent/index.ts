
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🔒 Enhanced payment intent creation request received')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const paymentData = await req.json()
    console.log('💰 Payment request data:', paymentData)

    // Validate required fields
    if (!paymentData.bookingId || !paymentData.amount) {
      throw new Error('Missing required fields: bookingId and amount')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get basic booking details without the problematic service JOIN
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select(`
        *, 
        venues(*)
      `)
      .eq('id', paymentData.bookingId)
      .single()

    if (bookingError) {
      console.error('❌ Failed to fetch booking:', bookingError)
      throw bookingError;
    }

    if (!booking) {
      console.error('❌ Booking not found for ID:', paymentData.bookingId)
      throw new Error('Booking not found')
    }

    console.log('📝 Booking found:', {
      booking_id: paymentData.bookingId,
      service_name: booking.service,
      party_size: booking.party_size,
      venue_id: booking.venue_id
    });

    // Securely lookup service by title/name if service is specified in booking
    let serviceInfo = null;
    let calculatedAmount = paymentData.amount; // Use request amount as fallback

    if (booking.service && booking.service !== 'Dinner') {
      console.log('🔍 Looking up service information for:', booking.service);
      
      const { data: service, error: serviceError } = await supabaseClient
        .from('services')
        .select(`
          id,
          title,
          requires_payment,
          charge_type,
          charge_amount_per_guest,
          minimum_guests_for_charge
        `)
        .eq('venue_id', booking.venue_id)
        .eq('title', booking.service)
        .maybeSingle();

      if (service && !serviceError) {
        serviceInfo = service;
        console.log('✅ Service found:', {
          service_id: service.id,
          title: service.title,
          requires_payment: service.requires_payment,
          charge_type: service.charge_type
        });

        // Calculate amount based on service settings
        if (service.requires_payment && service.charge_type === 'per_guest') {
          const chargePerGuest = service.charge_amount_per_guest || 0;
          const minGuests = service.minimum_guests_for_charge || 1;
          const chargingPartySize = Math.max(booking.party_size, minGuests);
          calculatedAmount = chargePerGuest * chargingPartySize;
          
          console.log('💰 Service-based calculation:', {
            charge_per_guest: chargePerGuest,
            party_size: booking.party_size,
            min_guests: minGuests,
            charging_party_size: chargingPartySize,
            calculated_amount: calculatedAmount
          });
        }
      } else {
        console.log('⚠️ Service not found, using request amount as fallback');
      }
    }

    console.log('💰 Final payment calculation:', {
      booking_id: paymentData.bookingId,
      service_title: serviceInfo?.title || booking.service,
      party_size: booking.party_size,
      calculated_amount_pence: calculatedAmount,
      requested_amount_pence: paymentData.amount
    });

    // Use the calculated amount (either from service or request)
    const finalAmount = calculatedAmount;

    // Get venue's Stripe settings with enhanced validation
    const { data: stripeSettings } = await supabaseClient
      .from('venue_stripe_settings')
      .select('*')
      .eq('venue_id', booking.venue_id)
      .eq('is_active', true)
      .single()

    if (!stripeSettings?.stripe_account_id) {
      throw new Error('Venue Stripe integration not configured')
    }

    // Determine if we're in test mode
    const isTestMode = stripeSettings.test_mode ?? true
    const stripeSecretKey = isTestMode 
      ? Deno.env.get('STRIPE_TEST_SECRET_KEY')
      : Deno.env.get('STRIPE_SECRET_KEY')

    console.log('🔑 Payment mode configuration:', {
      isTestMode,
      keyName: isTestMode ? 'STRIPE_TEST_SECRET_KEY' : 'STRIPE_SECRET_KEY',
      keyConfigured: !!stripeSecretKey,
      keyPrefix: stripeSecretKey ? `${stripeSecretKey.slice(0, 7)}...` : 'not configured'
    })

    if (!stripeSecretKey) {
      throw new Error(`Stripe ${isTestMode ? 'test' : 'live'} secret key not configured`)
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    // Determine currency from venue settings or default to GBP
    const currency = paymentData.currency || 'gbp'
    
    // Calculate application fee (Grace Platform takes 3%)
    const applicationFeeAmount = Math.round(finalAmount * 0.03)

    console.log('💳 Creating payment intent with Stripe...', { 
      amount: finalAmount, 
      currency, 
      test_mode: isTestMode,
      booking_id: paymentData.bookingId 
    })

    // Create payment intent with proper metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: currency,
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: stripeSettings.stripe_account_id,
      },
      metadata: {
        booking_id: paymentData.bookingId.toString(),
        venue_id: booking.venue_id,
        guest_name: booking.guest_name,
        party_size: booking.party_size.toString(),
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        service_name: serviceInfo?.title || booking.service,
        threat_level: threatLevel,
        test_mode: isTestMode.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    console.log('💳 Payment Intent created successfully:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      test_mode: isTestMode,
      booking_id: paymentData.bookingId,
      client_secret_present: !!paymentIntent.client_secret
    })

    // Create booking payment record
    const { error: paymentRecordError } = await supabaseClient
      .from('booking_payments')
      .insert({
        booking_id: paymentData.bookingId,
        stripe_payment_intent_id: paymentIntent.id,
        amount_cents: finalAmount,
        status: 'pending'
      })

    if (paymentRecordError) {
      console.error('❌ Failed to create payment record:', paymentRecordError)
      // Don't throw here, the payment intent was created successfully
    } else {
      console.log('✅ Payment record created with correct amount:', finalAmount)
    }

    // Log payment initiation analytics
    await supabaseClient
      .from('payment_analytics')
      .insert({
        booking_id: paymentData.bookingId,
        venue_id: booking.venue_id,
        event_type: 'payment_initiated',
        event_data: {
          amount_cents: finalAmount,
          currency: currency,
          party_size: booking.party_size,
          service: serviceInfo?.title || booking.service,
          test_mode: isTestMode
        }
      })

    console.log('✅ Payment intent process completed successfully')

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: finalAmount,
        currency: currency
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Payment intent creation failed:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create payment intent',
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
