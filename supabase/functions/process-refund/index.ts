
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

    // Create Stripe refund (simplified for demo - in production, use actual Stripe API)
    const stripe_refund_id = `re_${crypto.randomUUID().slice(0, 24)}`;

    // Update payment record with refund information - use valid status
    const { error: updateError } = await supabase
      .from('booking_payments')
      .update({
        refund_amount_cents,
        refund_status: 'processed', // Use valid status from constraint
        refund_reason,
        refunded_at: new Date().toISOString(),
        stripe_refund_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment_id);

    if (updateError) {
      console.error('Update error:', updateError);
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
        old_value: '0',
        new_value: (refund_amount_cents / 100).toString(),
        notes: `Refund processed: £${(refund_amount_cents / 100).toFixed(2)} - Reason: ${refund_reason}`
      }]);

    // If full refund and booking is confirmed, update booking status
    if (refund_amount_cents === payment.amount_cents) {
      await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking_id);

      // Log status change
      await supabase
        .from('booking_audit')
        .insert([{
          booking_id,
          venue_id,
          change_type: 'status_change',
          field_name: 'status',
          old_value: 'confirmed',
          new_value: 'cancelled',
          notes: `Booking cancelled due to full refund: £${(refund_amount_cents / 100).toFixed(2)}`
        }]);
    }

    console.log('✅ Refund processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        refund_id: stripe_refund_id,
        amount_refunded: refund_amount_cents 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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
