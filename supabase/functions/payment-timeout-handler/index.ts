
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

    console.log('🔄 Starting payment timeout handler...');

    // Find bookings stuck in pending_payment for more than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: pendingBookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, booking_reference, venue_id, guest_name')
      .eq('status', 'pending_payment')
      .lt('created_at', thirtyMinutesAgo);

    if (bookingError) {
      throw new Error(`Error fetching pending bookings: ${bookingError.message}`);
    }

    console.log(`📋 Found ${pendingBookings?.length || 0} timed out bookings`);

    if (!pendingBookings || pendingBookings.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No timed out bookings found',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    let processedCount = 0;

    for (const booking of pendingBookings) {
      try {
        console.log(`⏰ Processing timeout for booking ${booking.booking_reference}`);

        // Cancel the booking
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id);

        if (updateError) {
          console.error(`❌ Error updating booking ${booking.booking_reference}:`, updateError);
          continue;
        }

        // Mark any associated payment as failed
        const { error: paymentError } = await supabase
          .from('booking_payments')
          .update({ 
            status: 'failed',
            failure_reason: 'Payment timeout - booking cancelled after 30 minutes',
            updated_at: new Date().toISOString()
          })
          .eq('booking_id', booking.id);

        if (paymentError) {
          console.error(`⚠️ Error updating payment for booking ${booking.booking_reference}:`, paymentError);
        }

        // Create audit log
        await supabase
          .from('booking_audit')
          .insert([{
            booking_id: booking.id,
            venue_id: booking.venue_id,
            change_type: 'payment_timeout_cancellation',
            field_name: 'status',
            old_value: 'pending_payment',
            new_value: 'cancelled',
            notes: `Booking automatically cancelled due to payment timeout (30 minutes)`,
            changed_by: 'system',
            source_type: 'automated_timeout_handler',
            source_details: {
              timeout_minutes: 30,
              processed_at: new Date().toISOString(),
              reason: 'payment_timeout'
            }
          }]);

        processedCount++;
        console.log(`✅ Cancelled booking ${booking.booking_reference} due to payment timeout`);

      } catch (error) {
        console.error(`❌ Error processing booking ${booking.booking_reference}:`, error);
      }
    }

    console.log(`🎯 Processed ${processedCount} timed out bookings`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${processedCount} timed out bookings`,
      processed: processedCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('💥 Payment timeout handler error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
