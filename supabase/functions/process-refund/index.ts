
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createErrorResponse, corsHeaders } from '../_shared/errorSanitizer.ts';
import { ok } from '../_shared/apiResponse.ts';

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
      override_window = false 
    } = await req.json();

    console.log('💰 Processing refund:', {
      payment_id,
      refund_amount_cents,
      refund_reason,
      booking_id
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

    if (!payment.stripe_payment_intent_id) {
      throw new Error('Payment missing Stripe payment intent ID');
    }

    // Validate refund amount
    if (refund_amount_cents > payment.amount_cents) {
      throw new Error('Refund amount cannot exceed original payment');
    }

    // Check for existing refunds
    if (payment.refund_amount_cents > 0) {
      const totalRefund = payment.refund_amount_cents + refund_amount_cents;
      if (totalRefund > payment.amount_cents) {
        throw new Error('Total refund amount would exceed original payment');
      }
    }

    // Get Stripe settings for this venue
    console.log('🔑 Retrieving Stripe configuration for venue:', venue_id);
    const { data: stripeKeys, error: stripeError } = await supabase.functions.invoke('get-stripe-keys', {
      body: {
        venue_id: venue_id,
        environment: 'test', // TODO: Make this dynamic based on venue settings
        key_type: 'secret'
      }
    });

    if (stripeError || !stripeKeys?.secret_key) {
      console.error('Failed to retrieve Stripe keys:', stripeError);
      throw new Error('Stripe configuration not available for this venue');
    }

    // Initialize Stripe with the venue's secret key
    const stripe = new Stripe(stripeKeys.secret_key, {
      apiVersion: '2023-10-16',
    });

    console.log('💳 Creating Stripe refund for payment intent:', payment.stripe_payment_intent_id);

    // Determine refund status based on amount
    const totalRefundAfter = (payment.refund_amount_cents || 0) + refund_amount_cents;
    const refundStatus = totalRefundAfter >= payment.amount_cents ? 'full' : 'partial';

    console.log('🔄 Determined refund status:', refundStatus);

    // Set processing status first
    const { error: processingError } = await supabase
      .from('booking_payments')
      .update({
        refund_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment_id);

    if (processingError) {
      console.error('Error setting processing status:', processingError);
      throw processingError;
    }

    try {
      // Create actual Stripe refund
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripe_payment_intent_id,
        amount: refund_amount_cents,
        reason: 'requested_by_customer',
        metadata: {
          booking_id: booking_id.toString(),
          venue_id: venue_id,
          refund_reason: refund_reason,
          processed_by: 'grace_system'
        }
      });

      console.log('✅ Stripe refund created successfully:', refund.id);

      // Update payment record with actual refund information
      const { error: updateError } = await supabase
        .from('booking_payments')
        .update({
          refund_amount_cents: totalRefundAfter,
          refund_status: refundStatus,
          refund_reason,
          refunded_at: new Date().toISOString(),
          stripe_refund_id: refund.id, // Use actual Stripe refund ID
          updated_at: new Date().toISOString()
        })
        .eq('id', payment_id);

      if (updateError) {
        console.error('Error updating payment with refund:', updateError);
        throw updateError;
      }

      // Log refund in booking audit
      await supabase
        .from('booking_audit')
        .insert([{
          booking_id,
          venue_id,
          change_type: 'refund_processed',
          field_name: 'refund_amount',
          old_value: ((payment.refund_amount_cents || 0) / 100).toString(),
          new_value: (totalRefundAfter / 100).toString(),
          notes: `Stripe refund processed: £${(refund_amount_cents / 100).toFixed(2)} - Reason: ${refund_reason} - Status: ${refundStatus} - Stripe ID: ${refund.id}`
        }]);

      // If full refund and booking is confirmed, update booking status
      if (refundStatus === 'full') {
        await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', booking_id);
      }

      console.log('✅ Refund processed successfully');

      return new Response(
        JSON.stringify(ok({
          success: true,
          refund_id: refund.id,
          amount_refunded: refund_amount_cents,
          refund_status: refundStatus,
          stripe_refund_status: refund.status
        })),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (stripeError) {
      console.error('❌ Stripe refund creation failed:', stripeError);
      
      // Set failed status if Stripe refund fails
      await supabase
        .from('booking_payments')
        .update({
          refund_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment_id);
      
      // Provide more specific error messages based on Stripe error type
      let errorMessage = 'Stripe refund failed';
      if (stripeError.code === 'charge_already_refunded') {
        errorMessage = 'This payment has already been fully refunded';
      } else if (stripeError.code === 'amount_too_large') {
        errorMessage = 'Refund amount exceeds available balance';
      } else if (stripeError.code === 'payment_intent_not_found') {
        errorMessage = 'Original payment not found in Stripe';
      } else if (stripeError.message) {
        errorMessage = `Stripe error: ${stripeError.message}`;
      }
      
      throw new Error(errorMessage);
    }

  } catch (error) {
    console.error('❌ Error processing refund:', error);
    return createErrorResponse(error, 500);
  }
});
