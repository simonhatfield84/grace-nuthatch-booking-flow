
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

    // Create Stripe refund (simplified for demo - in production, use actual Stripe API)
    const stripe_refund_id = `re_${crypto.randomUUID().slice(0, 24)}`;

    try {
      // Update payment record with refund information
      const { error: updateError } = await supabase
        .from('booking_payments')
        .update({
          refund_amount_cents: totalRefundAfter,
          refund_status: refundStatus,
          refund_reason,
          refunded_at: new Date().toISOString(),
          stripe_refund_id,
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
          notes: `Refund processed: £${(refund_amount_cents / 100).toFixed(2)} - Reason: ${refund_reason} - Status: ${refundStatus}`
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
        JSON.stringify({ 
          success: true, 
          refund_id: stripe_refund_id,
          amount_refunded: refund_amount_cents,
          refund_status: refundStatus
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      // Set failed status if something goes wrong
      await supabase
        .from('booking_payments')
        .update({
          refund_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment_id);
      
      throw error;
    }

  } catch (error) {
    console.error('❌ Error processing refund:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
