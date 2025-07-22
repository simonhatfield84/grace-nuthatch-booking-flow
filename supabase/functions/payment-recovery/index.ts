
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecoveryRequest {
  bookingId?: number;
  batchCheck?: boolean;
  maxAge?: number; // hours
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔧 Payment recovery function started');

  try {
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

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const { bookingId, batchCheck = false, maxAge = 24 }: RecoveryRequest = await req.json();

    if (bookingId) {
      // Single booking recovery
      console.log(`🔍 Recovering single booking: ${bookingId}`);
      const result = await recoverSingleBooking(supabaseAdmin, stripe, bookingId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (batchCheck) {
      // Batch recovery for stuck payments
      console.log(`🔍 Batch recovery for payments stuck within ${maxAge} hours`);
      const result = await batchRecovery(supabaseAdmin, stripe, maxAge);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid request parameters' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Payment recovery error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

async function recoverSingleBooking(supabase: any, stripe: Stripe, bookingId: number) {
  console.log(`🔍 Checking booking ${bookingId}`);

  // Get booking and payment details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  const { data: payment, error: paymentError } = await supabase
    .from('booking_payments')
    .select('*')
    .eq('booking_id', bookingId)
    .single();

  if (paymentError || !payment) {
    throw new Error(`Payment record for booking ${bookingId} not found`);
  }

  console.log(`📊 Booking ${bookingId} status: ${booking.status}, Payment status: ${payment.status}`);

  // Check Stripe payment intent status
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
    console.log(`💳 Stripe payment intent status: ${paymentIntent.status}`);

    let bookingUpdated = false;
    let emailSent = false;

    // Update booking based on Stripe status
    if (paymentIntent.status === 'succeeded' && booking.status !== 'confirmed') {
      await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          cancellation_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      await supabase
        .from('booking_payments')
        .update({ 
          status: 'succeeded',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      bookingUpdated = true;

      // Send confirmation email
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            booking_id: bookingId,
            guest_email: booking.email,
            venue_id: booking.venue_id,
            email_type: 'booking_confirmation'
          }
        });
        emailSent = true;
        console.log(`✅ Confirmation email sent for booking ${bookingId}`);
      } catch (emailError) {
        console.error(`❌ Failed to send email for booking ${bookingId}:`, emailError);
      }

      // Log analytics
      await supabase
        .from('payment_analytics')
        .insert({
          booking_id: bookingId,
          venue_id: booking.venue_id,
          event_type: 'payment_recovered',
          event_data: {
            original_status: booking.status,
            stripe_status: paymentIntent.status,
            recovered_at: new Date().toISOString()
          }
        });

    } else if (paymentIntent.status === 'canceled' || paymentIntent.status === 'payment_failed') {
      await supabase
        .from('bookings')
        .update({ 
          status: 'payment_failed',
          cancellation_reason: 'payment_declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      await supabase
        .from('booking_payments')
        .update({ 
          status: 'failed',
          failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      bookingUpdated = true;
    }

    return {
      success: true,
      bookingId,
      stripeStatus: paymentIntent.status,
      bookingUpdated,
      emailSent,
      message: `Booking ${bookingId} recovered successfully`
    };

  } catch (stripeError: any) {
    console.error(`❌ Stripe API error for booking ${bookingId}:`, stripeError);
    throw new Error(`Stripe API error: ${stripeError.message}`);
  }
}

async function batchRecovery(supabase: any, stripe: Stripe, maxAge: number) {
  console.log(`🔍 Starting batch recovery for payments within ${maxAge} hours`);

  // Find bookings with pending payment status
  const { data: stuckBookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      booking_payments(*)
    `)
    .in('status', ['pending_payment', 'payment_failed'])
    .gte('created_at', new Date(Date.now() - maxAge * 60 * 60 * 1000).toISOString());

  if (error) {
    throw new Error(`Failed to fetch stuck bookings: ${error.message}`);
  }

  console.log(`📊 Found ${stuckBookings?.length || 0} stuck bookings`);

  const results = [];
  for (const booking of stuckBookings || []) {
    try {
      const result = await recoverSingleBooking(supabase, stripe, booking.id);
      results.push(result);
    } catch (error: any) {
      console.error(`❌ Failed to recover booking ${booking.id}:`, error);
      results.push({
        success: false,
        bookingId: booking.id,
        error: error.message
      });
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    success: true,
    totalProcessed: results.length,
    successful,
    failed,
    results
  };
}

serve(handler);
