
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from 'npm:resend@4.0.0';

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

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const { booking_id, amount_cents, guest_email, custom_message, venue_id } = await req.json();

    console.log('📧 Sending payment request:', {
      booking_id,
      amount_cents,
      guest_email,
      venue_id
    });

    // Get booking and venue details
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, venues(*)')
      .eq('id', booking_id)
      .single();

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Generate secure payment link
    const paymentToken = crypto.randomUUID();
    const paymentLink = `https://wxyotttvyexxzeaewyga.supabase.co/booking-widget?payment=${paymentToken}`;

    // Create payment request record
    const { error: requestError } = await supabase
      .from('payment_requests')
      .insert([{
        booking_id,
        venue_id,
        payment_link: paymentLink,
        amount_cents,
        status: 'sent'
      }]);

    if (requestError) throw requestError;

    // Create payment intent for this booking
    const { error: intentError } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        bookingId: booking_id,
        amount: amount_cents,
        currency: 'gbp',
        description: `Payment for booking ${booking_id}`,
        metadata: { payment_token: paymentToken }
      }
    });

    if (intentError) {
      console.error('Failed to create payment intent:', intentError);
    }

    // Send email with payment request
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Required for Your Booking</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details</h3>
          <p><strong>Venue:</strong> ${booking.venues?.name || 'The Venue'}</p>
          <p><strong>Date:</strong> ${booking.booking_date}</p>
          <p><strong>Time:</strong> ${booking.booking_time}</p>
          <p><strong>Party Size:</strong> ${booking.party_size}</p>
          <p><strong>Service:</strong> ${booking.service}</p>
        </div>

        <div style="background: #fee; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Payment Required</h3>
          <p><strong>Amount:</strong> £${(amount_cents / 100).toFixed(2)}</p>
          <p>Please complete your payment to confirm your booking.</p>
          ${custom_message ? `<p><em>"${custom_message}"</em></p>` : ''}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentLink}" 
             style="background: #000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Complete Payment
          </a>
        </div>

        <div style="color: #666; font-size: 14px; margin-top: 20px;">
          <p>This payment request expires in 24 hours.</p>
          <p>If you have any questions, please contact ${booking.venues?.email || 'the venue'}.</p>
        </div>
      </div>
    `;

    const { error: emailError } = await resend.emails.send({
      from: `${booking.venues?.name || 'Venue'} <noreply@gracereservations.com>`,
      to: [guest_email],
      subject: `Payment Required - Booking Confirmation`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Email sending failed:', emailError);
      throw new Error('Failed to send payment request email');
    }

    // Log the payment request in booking audit
    await supabase
      .from('booking_audit')
      .insert([{
        booking_id,
        venue_id,
        change_type: 'payment_requested',
        field_name: 'payment_status',
        new_value: 'request_sent',
        notes: `Payment request sent to ${guest_email} for £${(amount_cents / 100).toFixed(2)}`
      }]);

    console.log('✅ Payment request sent successfully');

    return new Response(
      JSON.stringify({ success: true, payment_link: paymentLink }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error sending payment request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
