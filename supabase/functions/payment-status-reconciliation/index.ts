
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 Starting payment status reconciliation...');

    // Find payments that are pending for more than 5 minutes (should have webhook by now)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: pendingPayments, error: paymentError } = await supabase
      .from('booking_payments')
      .select(`
        id,
        booking_id,
        stripe_payment_intent_id,
        status,
        bookings!inner(venue_id, booking_reference, status)
      `)
      .eq('status', 'pending')
      .lt('created_at', fiveMinutesAgo);

    if (paymentError) {
      throw new Error(`Error fetching pending payments: ${paymentError.message}`);
    }

    console.log(`💳 Found ${pendingPayments?.length || 0} payments to reconcile`);

    if (!pendingPayments || pendingPayments.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No payments to reconcile',
        reconciled: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    let reconciledCount = 0;

    for (const payment of pendingPayments) {
      try {
        if (!payment.stripe_payment_intent_id) {
          console.log(`⚠️ Payment ${payment.id} has no Stripe payment intent ID, skipping`);
          continue;
        }

        // Get venue Stripe settings to determine which key to use
        const { data: stripeSettings } = await supabase
          .from('venue_stripe_settings')
          .select('test_mode')
          .eq('venue_id', payment.bookings.venue_id)
          .single();

        const stripeSecretKey = stripeSettings?.test_mode 
          ? Deno.env.get('STRIPE_TEST_SECRET_KEY')
          : Deno.env.get('STRIPE_SECRET_KEY');

        if (!stripeSecretKey) {
          console.error(`❌ No Stripe key found for venue ${payment.bookings.venue_id}`);
          continue;
        }

        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

        console.log(`🔍 Checking Stripe status for payment intent: ${payment.stripe_payment_intent_id}`);

        // Check actual status in Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);

        console.log(`📊 Stripe status: ${paymentIntent.status} for booking ${payment.bookings.booking_reference}`);

        // Reconcile based on Stripe status
        if (paymentIntent.status === 'succeeded') {
          // Payment succeeded - update our records
          await supabase
            .from('booking_payments')
            .update({ 
              status: 'succeeded',
              payment_method_type: paymentIntent.payment_method_types?.[0] || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id);

          // Confirm the booking
          await supabase
            .from('bookings')
            .update({ 
              status: 'confirmed',
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.booking_id);

          console.log(`✅ Reconciled successful payment for booking ${payment.bookings.booking_reference}`);
          reconciledCount++;

        } else if (['failed', 'canceled'].includes(paymentIntent.status)) {
          // Payment failed - mark as failed and cancel booking
          await supabase
            .from('booking_payments')
            .update({ 
              status: 'failed',
              failure_reason: `Stripe status: ${paymentIntent.status}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id);

          await supabase
            .from('bookings')
            .update({ 
              status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.booking_id);

          // Create audit log
          await supabase
            .from('booking_audit')
            .insert([{
              booking_id: payment.booking_id,
              venue_id: payment.bookings.venue_id,
              change_type: 'payment_reconciliation_failure',
              field_name: 'status',
              old_value: 'pending_payment',
              new_value: 'cancelled',
              notes: `Booking cancelled after payment reconciliation - Stripe status: ${paymentIntent.status}`,
              changed_by: 'system',
              source_type: 'payment_reconciliation',
              source_details: {
                stripe_status: paymentIntent.status,
                payment_intent_id: payment.stripe_payment_intent_id,
                reconciled_at: new Date().toISOString()
              }
            }]);

          console.log(`❌ Reconciled failed payment for booking ${payment.bookings.booking_reference}`);
          reconciledCount++;
        }

      } catch (error) {
        console.error(`❌ Error reconciling payment ${payment.id}:`, error);
      }
    }

    console.log(`🎯 Reconciled ${reconciledCount} payments`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Reconciled ${reconciledCount} payments`,
      reconciled: reconciledCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('💥 Payment reconciliation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
