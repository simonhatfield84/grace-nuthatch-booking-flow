
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { booking_id, venue_id, amount_cents, custom_message } = await req.json()

    console.log('Processing payment request:', { booking_id, venue_id, amount_cents });

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      throw new Error('Booking not found')
    }

    // Get venue details
    const { data: venue, error: venueError } = await supabaseClient
      .from('venues')
      .select('name, email')
      .eq('id', venue_id)
      .single()

    if (venueError || !venue) {
      throw new Error('Venue not found')
    }

    // Create Stripe payment intent
    const { data: paymentIntent, error: stripeError } = await supabaseClient.functions.invoke(
      'create-payment-intent',
      {
        body: {
          bookingId: booking_id,
          amount: amount_cents,
          currency: 'gbp',
          description: `Payment for booking ${booking.booking_reference || `BK-${booking_id}`}`,
          metadata: {
            venue_id: venue_id,
            guest_email: booking.email
          }
        }
      }
    )

    if (stripeError || !paymentIntent) {
      throw new Error('Failed to create payment intent')
    }

    // Create payment request record
    const paymentLink = `https://wxyotttvyexxzeaewyga.supabase.co/payment/${paymentIntent.payment_intent_id}`
    
    const { error: requestError } = await supabaseClient
      .from('payment_requests')
      .insert([{
        booking_id,
        venue_id,
        amount_cents,
        payment_link: paymentLink,
        status: 'pending'
      }])

    if (requestError) {
      throw new Error('Failed to create payment request record')
    }

    // Get venue email settings
    const { data: venueSettings } = await supabaseClient
      .from('venue_settings')
      .select('setting_key, setting_value')
      .eq('venue_id', venue_id)
      .in('setting_key', ['from_email', 'from_name', 'email_signature']);

    const venueEmailSettings: Record<string, string> = {};
    venueSettings?.forEach(setting => {
      try {
        const parsedValue = typeof setting.setting_value === 'string' 
          ? JSON.parse(setting.setting_value) 
          : setting.setting_value;
        venueEmailSettings[setting.setting_key] = String(parsedValue || '');
      } catch {
        venueEmailSettings[setting.setting_key] = String(setting.setting_value || '');
      }
    });

    // Get platform settings for fallback
    const { data: platformSettings } = await supabaseClient
      .from('platform_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['from_email', 'from_name']);

    const platformEmailSettings: Record<string, string> = {};
    platformSettings?.forEach(setting => {
      try {
        const parsedValue = typeof setting.setting_value === 'string' 
          ? JSON.parse(setting.setting_value) 
          : setting.setting_value;
        platformEmailSettings[setting.setting_key] = String(parsedValue || '');
      } catch {
        platformEmailSettings[setting.setting_key] = String(setting.setting_value || '');
      }
    });

    // Set from address
    const fromEmail = venueEmailSettings.from_email || platformEmailSettings.from_email || 'nuthatch@grace-os.co.uk';
    const fromName = venueEmailSettings.from_name || venue.name || platformEmailSettings.from_name || 'Grace OS';
    const fromAddress = `${fromName} <${fromEmail}>`;

    // Format booking date and time
    const bookingDate = new Date(booking.booking_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formatTime = (timeString: string): string => {
      if (!timeString) return '';
      const timeParts = timeString.split(':');
      const hours = parseInt(timeParts[0]);
      const minutes = timeParts[1] || '00';
      
      if (hours === 0) {
        return `12:${minutes} AM`;
      } else if (hours < 12) {
        return `${hours}:${minutes} AM`;
      } else if (hours === 12) {
        return `12:${minutes} PM`;
      } else {
        return `${hours - 12}:${minutes} PM`;
      }
    };

    const bookingTime = formatTime(booking.booking_time);
    const paymentAmount = `£${(amount_cents / 100).toFixed(2)}`;
    const emailSignature = venueEmailSettings.email_signature || `Best regards,\n${venue.name} Team`;

    // Create email content
    const subject = `Payment Request - ${venue.name} Booking`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #000; margin: 20px 0;">${venue.name}</h2>
          <p style="color: #666; margin: 5px 0;">Payment Request</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
          <h2 style="color: #000; margin-top: 0;">Payment Required</h2>
          <p>Dear ${booking.guest_name},</p>
          <p>A payment is required to secure your booking at ${venue.name}.</p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd;">
            <h3 style="margin-top: 0; color: #000;">Booking Details</h3>
            <p><strong>Reference:</strong> ${booking.booking_reference || `BK-${booking.id}`}</p>
            <p><strong>Service:</strong> ${booking.service || 'Dinner'}</p>
            <p><strong>Date:</strong> ${bookingDate}</p>
            <p><strong>Time:</strong> ${bookingTime}</p>
            <p><strong>Party Size:</strong> ${booking.party_size} ${booking.party_size === 1 ? 'guest' : 'guests'}</p>
            <p><strong>Amount Due:</strong> ${paymentAmount}</p>
          </div>
          
          ${custom_message ? `
          <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <p style="margin: 0; font-style: italic;">${custom_message}</p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink}" style="background: #000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Pay Now</a>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This payment request will expire in 24 hours. Please complete your payment to secure your booking.
          </p>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
          <p style="white-space: pre-line;">${emailSignature}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>
    `;

    console.log('Sending payment request email to:', booking.email);

    // Send email directly using Resend
    const emailResponse = await resend.emails.send({
      from: fromAddress,
      to: [booking.email],
      subject,
      html,
    });

    console.log('Email response:', emailResponse);

    if (emailResponse.error) {
      console.error('Email sending failed:', emailResponse.error);
      throw new Error(`Failed to send payment request email: ${emailResponse.error.message}`);
    }

    // Update booking status to pending_payment
    await supabaseClient
      .from('bookings')
      .update({ status: 'pending_payment' })
      .eq('id', booking_id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        payment_intent_id: paymentIntent.payment_intent_id,
        payment_link: paymentLink,
        email_id: emailResponse.data?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
