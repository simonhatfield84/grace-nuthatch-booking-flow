import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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

    const { 
      payment_id, 
      refund_amount_cents, 
      refund_reason, 
      booking_id, 
      venue_id,
      override_window = false,
      changed_by = null,
      cancel_booking = false
    } = await req.json();

    console.log('💰 Processing refund:', {
      payment_id,
      refund_amount_cents,
      refund_reason,
      booking_id,
      changed_by,
      cancel_booking
    });

    // Get payment details
    const { data: payment } = await supabase
      .from('booking_payments')
      .select('*')
      .eq('id', payment_id)
      .single();

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'succeeded') {
      throw new Error('Can only refund successful payments');
    }

    // Validate refund amount
    if (refund_amount_cents > payment.amount_cents) {
      throw new Error('Refund amount cannot exceed original payment');
    }

    if (!payment.stripe_payment_intent_id) {
      throw new Error('No Stripe payment intent ID found for this payment');
    }

    console.log('📋 Found payment:', {
      stripe_payment_intent_id: payment.stripe_payment_intent_id,
      original_amount: payment.amount_cents,
      refund_amount: refund_amount_cents
    });

    // Get venue Stripe settings to determine which key to use
    const { data: stripeSettings } = await supabase
      .from('venue_stripe_settings')
      .select('test_mode, is_active')
      .eq('venue_id', venue_id)
      .single();

    if (!stripeSettings?.is_active) {
      throw new Error('Stripe is not configured for this venue');
    }

    // Get the appropriate Stripe secret key
    const stripeSecretKey = stripeSettings.test_mode 
      ? Deno.env.get('STRIPE_TEST_SECRET_KEY')
      : Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      throw new Error(`Stripe secret key not configured for ${stripeSettings.test_mode ? 'test' : 'live'} mode`);
    }

    console.log('🔑 Using Stripe key for mode:', stripeSettings.test_mode ? 'test' : 'live');

    // Create refund via Stripe API
    const refundData = {
      payment_intent: payment.stripe_payment_intent_id,
      amount: refund_amount_cents,
      reason: 'requested_by_customer', // Stripe expects specific reason values
      metadata: {
        booking_id: booking_id.toString(),
        venue_id: venue_id,
        refund_reason: refund_reason || 'No reason provided',
        processed_by: changed_by || 'system'
      }
    };

    console.log('🚀 Creating Stripe refund:', refundData);

    const stripeResponse = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        payment_intent: refundData.payment_intent,
        amount: refundData.amount.toString(),
        reason: refundData.reason,
        'metadata[booking_id]': refundData.metadata.booking_id,
        'metadata[venue_id]': refundData.metadata.venue_id,
        'metadata[refund_reason]': refundData.metadata.refund_reason,
        'metadata[processed_by]': refundData.metadata.processed_by
      }).toString()
    });

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error('❌ Stripe refund failed:', errorText);
      
      let errorMessage = 'Stripe refund failed';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        // If we can't parse the error, use the raw text
        errorMessage = errorText;
      }
      
      throw new Error(`Stripe refund failed: ${errorMessage}`);
    }

    const stripeRefund = await stripeResponse.json();
    console.log('✅ Stripe refund successful:', {
      refund_id: stripeRefund.id,
      status: stripeRefund.status,
      amount: stripeRefund.amount
    });

    // Determine refund status based on amount
    let refund_status = 'none';
    if (refund_amount_cents === payment.amount_cents) {
      refund_status = 'full';
    } else if (refund_amount_cents > 0) {
      refund_status = 'partial';
    }

    // Update payment record with actual Stripe refund information
    const { error: updateError } = await supabase
      .from('booking_payments')
      .update({
        refund_amount_cents,
        refund_status,
        refund_reason,
        refunded_at: new Date().toISOString(),
        stripe_refund_id: stripeRefund.id, // Use actual Stripe refund ID
        updated_at: new Date().toISOString()
      })
      .eq('id', payment_id);

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      throw updateError;
    }

    // Only cancel booking if cancel_booking parameter is true
    if (cancel_booking) {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking_id);

      if (bookingError) {
        console.error('❌ Booking update error:', bookingError);
        throw bookingError;
      }

      console.log('📋 Booking cancelled as requested');
    } else {
      console.log('📋 Booking status unchanged (independent refund)');
    }

    // Log refund in booking audit - always log the refund processing
    const refundAuditNote = cancel_booking
      ? `Booking cancellation with ${refund_status} refund: £${(refund_amount_cents / 100).toFixed(2)} - Stripe refund ID: ${stripeRefund.id}`
      : `Independent ${refund_status} refund processed: £${(refund_amount_cents / 100).toFixed(2)} - Reason: ${refund_reason || 'No reason provided'} - Stripe ID: ${stripeRefund.id}`;

    await supabase
      .from('booking_audit')
      .insert([{
        booking_id,
        venue_id,
        change_type: 'refund_processed',
        field_name: 'refund_amount',
        old_value: '0',
        new_value: (refund_amount_cents / 100).toString(),
        changed_by: changed_by,
        notes: refundAuditNote
      }]);

    // Only log status change if booking was actually cancelled
    if (cancel_booking) {
      await supabase
        .from('booking_audit')
        .insert([{
          booking_id,
          venue_id,
          change_type: 'status_change',
          field_name: 'status',
          old_value: 'confirmed',
          new_value: 'cancelled',
          changed_by: changed_by,
          notes: `Booking cancelled with ${refund_status} refund: £${(refund_amount_cents / 100).toFixed(2)} - Stripe refund ID: ${stripeRefund.id}`
        }]);
    }

    console.log('✅ Refund processing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        refund_id: stripeRefund.id,
        amount_refunded: refund_amount_cents,
        refund_status,
        stripe_status: stripeRefund.status,
        booking_cancelled: cancel_booking
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error processing refund:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
