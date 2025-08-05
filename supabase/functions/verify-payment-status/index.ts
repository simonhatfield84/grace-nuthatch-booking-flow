
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Payment status verification request received');

    const { payment_intent_id, booking_id } = await req.json();

    let paymentIntentId = payment_intent_id;

    // If no payment_intent_id provided but booking_id is available, fetch it from database
    if (!paymentIntentId && booking_id) {
      console.log('💾 No payment_intent_id provided, fetching from database for booking:', booking_id);
      
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      const { data: paymentRecord, error: fetchError } = await supabaseAdmin
        .from('booking_payments')
        .select('stripe_payment_intent_id')
        .eq('booking_id', booking_id)
        .single();

      if (fetchError || !paymentRecord?.stripe_payment_intent_id) {
        console.error('❌ Could not find payment intent for booking:', booking_id);
        throw new Error('Payment record not found for this booking');
      }

      paymentIntentId = paymentRecord.stripe_payment_intent_id;
      console.log('✅ Found payment intent from database:', paymentIntentId);
    }

    if (!paymentIntentId) {
      throw new Error('Payment Intent ID is required');
    }

    const stripeKey = Deno.env.get('STRIPE_TEST_SECRET_KEY') || Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16'
    });

    console.log('💳 Retrieving payment intent from Stripe:', paymentIntentId);

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    console.log('📊 Payment Intent status:', paymentIntent.status);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Log the verification attempt
    await supabaseAdmin
      .from('security_audit')
      .insert({
        event_type: 'payment_status_verification',
        event_details: {
          payment_intent_id: paymentIntentId,
          booking_id,
          stripe_status: paymentIntent.status,
          amount: paymentIntent.amount,
          verification_trigger: 'manual_check'
        }
      });

    const response = {
      payment_intent_id: paymentIntent.id,
      stripe_status: paymentIntent.status,
      payment_succeeded: paymentIntent.status === 'succeeded',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created: paymentIntent.created
    };

    console.log('✅ Payment verification completed:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
