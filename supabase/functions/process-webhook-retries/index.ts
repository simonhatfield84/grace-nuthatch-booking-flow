import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting webhook retry processor');

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

    // Check for immediate retry request
    const { event_id, immediate } = await req.json().catch(() => ({}));

    let query = supabaseAdmin
      .from('webhook_retry_queue')
      .select('*')
      .order('next_attempt_at', { ascending: true })
      .limit(50);

    if (event_id) {
      // Immediate retry for specific event
      query = supabaseAdmin
        .from('webhook_retry_queue')
        .select('*')
        .eq('id', event_id)
        .limit(1);
    } else {
      // Normal processing - only events ready for retry
      query = query.lte('next_attempt_at', new Date().toISOString());
    }

    const { data: retryEvents, error: fetchError } = await query;

    if (fetchError) {
      console.error('❌ Failed to fetch retry events:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch retry events' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!retryEvents || retryEvents.length === 0) {
      console.log('✅ No events ready for retry');
      return new Response(
        JSON.stringify({ message: 'No events to process', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Processing ${retryEvents.length} retry events`);

    let successCount = 0;
    let failureCount = 0;

    for (const retryEvent of retryEvents) {
      console.log(`🔄 Retrying event: ${retryEvent.stripe_event_id} (attempt ${retryEvent.retry_count + 1})`);

      const event: StripeEvent = {
        id: retryEvent.stripe_event_id,
        type: retryEvent.event_type,
        data: retryEvent.payload,
        created: Math.floor(new Date(retryEvent.created_at).getTime() / 1000)
      };

      const result = await processWebhookEvent(
        supabaseAdmin,
        event,
        retryEvent.venue_id
      );

      if (result.success) {
        successCount++;
        console.log(`✅ Event processed successfully: ${retryEvent.stripe_event_id}`);

        await supabaseAdmin
          .from('webhook_retry_queue')
          .delete()
          .eq('id', retryEvent.id);

        await supabaseAdmin
          .from('webhook_events')
          .upsert({
            stripe_event_id: retryEvent.stripe_event_id,
            event_type: retryEvent.event_type,
            venue_id: retryEvent.venue_id,
            booking_id: result.bookingId,
            status: 'processed',
            error_message: null,
            raw_data: retryEvent.payload
          }, {
            onConflict: 'stripe_event_id',
            ignoreDuplicates: false
          });

      } else {
        failureCount++;
        console.error(`❌ Event processing failed: ${retryEvent.stripe_event_id}`, result.error);

        const newRetryCount = retryEvent.retry_count + 1;
        const backoffMinutes = 2 * Math.pow(2, Math.min(newRetryCount - 1, 6));
        
        const nextAttempt = newRetryCount > 10
          ? new Date(Date.now() + 24 * 60 * 60 * 1000)
          : new Date(Date.now() + backoffMinutes * 60 * 1000);

        await supabaseAdmin
          .from('webhook_retry_queue')
          .update({
            retry_count: newRetryCount,
            last_error: result.error,
            next_attempt_at: nextAttempt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', retryEvent.id);

        await supabaseAdmin
          .from('webhook_events')
          .upsert({
            stripe_event_id: retryEvent.stripe_event_id,
            event_type: retryEvent.event_type,
            venue_id: retryEvent.venue_id,
            status: 'failed',
            error_message: result.error,
            raw_data: retryEvent.payload
          }, {
            onConflict: 'stripe_event_id',
            ignoreDuplicates: false
          });
      }
    }

    console.log(`✅ Retry processor complete: ${successCount} success, ${failureCount} failures`);

    return new Response(
      JSON.stringify({
        message: 'Retry processing complete',
        processed: retryEvents.length,
        success: successCount,
        failed: failureCount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('💥 Retry processor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

async function processWebhookEvent(
  supabase: any,
  event: StripeEvent,
  venueId: string
): Promise<{ success: boolean; error?: string; bookingId?: number }> {
  try {
    let bookingId: number | undefined;

    switch (event.type) {
      case 'payment_intent.succeeded':
        bookingId = await handlePaymentSuccess(supabase, event, venueId);
        break;
      case 'payment_intent.payment_failed':
        bookingId = await handlePaymentFailure(supabase, event, venueId);
        break;
      case 'invoice.payment_succeeded':
        await handleSubscriptionPayment(supabase, event, venueId);
        break;
      default:
        console.log(`📋 Unhandled event type: ${event.type}`);
    }

    return { success: true, bookingId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handlePaymentSuccess(supabase: any, event: StripeEvent, venueId: string): Promise<number | undefined> {
  const paymentIntentId = event.data.object.id;
  const bookingId = event.data.object.metadata?.booking_id;
  
  console.log('💰 Processing payment success:', paymentIntentId, 'for booking:', bookingId);

  const now = new Date().toISOString();

  const { error: paymentError } = await supabase
    .from('booking_payments')
    .update({ 
      status: 'succeeded', 
      processed_at: now,
      updated_at: now
    })
    .eq('stripe_payment_intent_id', paymentIntentId);

  if (paymentError) {
    if (bookingId) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', parseInt(bookingId))
        .single();

      if (booking) {
        await supabase
          .from('booking_payments')
          .insert({
            booking_id: parseInt(bookingId),
            stripe_payment_intent_id: paymentIntentId,
            amount_cents: event.data.object.amount,
            status: 'succeeded',
            payment_method_type: event.data.object.payment_method?.type || 'card',
            processed_at: now,
            venue_id: booking.venue_id
          });
      }
    } else {
      throw new Error(`Failed to update payment: ${paymentError.message}`);
    }
  }

  if (bookingId) {
    await supabase
      .from('bookings')
      .update({ 
        status: 'confirmed',
        updated_at: now
      })
      .eq('id', parseInt(bookingId))
      .eq('venue_id', venueId);

    await supabase.functions.invoke('send-email', {
      body: {
        booking_id: parseInt(bookingId),
        venue_id: venueId,
        email_type: 'booking_confirmation',
      }
    });
  }

  return bookingId ? parseInt(bookingId) : undefined;
}

async function handlePaymentFailure(supabase: any, event: StripeEvent, venueId: string): Promise<number | undefined> {
  const paymentIntentId = event.data.object.id;
  const bookingId = event.data.object.metadata?.booking_id;
  
  const now = new Date().toISOString();
  
  await supabase
    .from('booking_payments')
    .update({ 
      status: 'failed', 
      failure_reason: event.data.object.last_payment_error?.message || 'Payment failed',
      processed_at: now,
      updated_at: now
    })
    .eq('stripe_payment_intent_id', paymentIntentId);

  if (bookingId) {
    await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        updated_at: now
      })
      .eq('id', parseInt(bookingId))
      .eq('venue_id', venueId);
  }

  return bookingId ? parseInt(bookingId) : undefined;
}

async function handleSubscriptionPayment(supabase: any, event: StripeEvent, venueId: string) {
  const invoice = event.data.object;
  
  await supabase
    .from('payment_transactions')
    .insert({
      venue_id: venueId,
      amount_cents: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      stripe_invoice_id: invoice.id,
      payment_method: invoice.payment_intent?.payment_method_types?.[0] || 'unknown',
      processed_at: new Date().toISOString()
    });
}

serve(handler);
