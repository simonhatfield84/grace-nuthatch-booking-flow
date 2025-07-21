
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  to?: string | string[];
  from?: string;
  from_name?: string;
  from_email?: string;
  subject?: string;
  html?: string;
  text?: string;
  // New fields for booking emails
  booking_id?: number;
  guest_email?: string;
  venue_id?: string;
  email_type?: string;
}

interface TemplateVariables {
  guest_name: string;
  venue_name: string;
  booking_date: string;
  booking_time: string;
  booking_end_time?: string;
  service?: string;
  party_size: string;
  booking_reference: string;
  email_signature: string;
  payment_status?: string;
  payment_amount?: string;
  cancel_link?: string;
  modify_link?: string;
  [key: string]: string | undefined;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const requestBody: SendEmailRequest = await req.json();

    // Handle booking email requests
    if (requestBody.booking_id && requestBody.guest_email && requestBody.venue_id) {
      console.log('📧 Processing booking email request:', {
        booking_id: requestBody.booking_id,
        guest_email: requestBody.guest_email,
        venue_id: requestBody.venue_id,
        email_type: requestBody.email_type
      });

      return await handleBookingEmail(supabase, requestBody);
    }

    // Handle direct email requests (legacy)
    const { 
      to, 
      from, 
      from_name, 
      from_email, 
      subject, 
      html, 
      text 
    } = requestBody;

    // Determine the from address
    let fromAddress: string;
    if (from) {
      fromAddress = from;
    } else if (from_name && from_email) {
      fromAddress = `${from_name} <${from_email}>`;
    } else {
      fromAddress = from_email || 'noreply@grace-os.co.uk';
    }

    console.log(`Sending email from: ${fromAddress} to: ${Array.isArray(to) ? to.join(', ') : to}`);

    const emailResponse = await resend.emails.send({
      from: fromAddress,
      to: Array.isArray(to) ? to : [to!],
      subject: subject!,
      html: html!,
      text,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function handleBookingEmail(supabase: any, request: SendEmailRequest): Promise<Response> {
  try {
    const { booking_id, guest_email, venue_id, email_type = 'booking_confirmation' } = request;

    console.log('🔍 Fetching booking details for ID:', booking_id);

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      console.error('❌ Error fetching booking:', bookingError);
      throw new Error('Booking not found');
    }

    console.log('📋 Booking details retrieved:', {
      id: booking.id,
      guest_name: booking.guest_name,
      venue_id: booking.venue_id
    });

    // Get venue details
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venue_id)
      .single();

    if (venueError || !venue) {
      console.error('❌ Error fetching venue:', venueError);
      throw new Error('Venue not found');
    }

    console.log('🏢 Venue details retrieved:', venue.name);

    // Get venue-specific email settings
    const { data: venueSettings } = await supabase
      .from('venue_settings')
      .select('setting_key, setting_value')
      .eq('venue_id', venue_id)
      .in('setting_key', ['from_email', 'from_name', 'email_signature']);

    const emailSettings: Record<string, string> = {};
    venueSettings?.forEach(setting => {
      try {
        const parsedValue = typeof setting.setting_value === 'string' 
          ? JSON.parse(setting.setting_value) 
          : setting.setting_value;
        emailSettings[setting.setting_key] = String(parsedValue || '');
      } catch {
        emailSettings[setting.setting_key] = String(setting.setting_value || '');
      }
    });

    console.log('⚙️ Email settings retrieved:', Object.keys(emailSettings));

    // Generate booking tokens for cancel/modify links
    let cancelLink = '';
    let modifyLink = '';
    
    try {
      const { data: cancelTokenData, error: cancelError } = await supabase
        .from('booking_tokens')
        .insert({
          booking_id: booking_id,
          token_type: 'cancel',
          token: generateToken(),
        })
        .select('token')
        .single();

      if (!cancelError && cancelTokenData) {
        const baseUrl = req.headers.get('origin') || 'https://grace-os.co.uk';
        cancelLink = `${baseUrl}/cancel-booking?token=${cancelTokenData.token}`;
      }

      const { data: modifyTokenData, error: modifyError } = await supabase
        .from('booking_tokens')
        .insert({
          booking_id: booking_id,
          token_type: 'modify',
          token: generateToken(),
        })
        .select('token')
        .single();

      if (!modifyError && modifyTokenData) {
        const baseUrl = req.headers.get('origin') || 'https://grace-os.co.uk';
        modifyLink = `${baseUrl}/modify-booking?token=${modifyTokenData.token}`;
      }
    } catch (error) {
      console.warn('⚠️ Failed to generate booking tokens:', error);
    }

    // Calculate end time
    let bookingEndTime = '';
    if (booking.end_time) {
      bookingEndTime = booking.end_time;
    } else if (booking.duration_minutes) {
      const [hours, minutes] = booking.booking_time.split(':').map(Number);
      const startTime = new Date();
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(startTime.getTime() + booking.duration_minutes * 60000);
      bookingEndTime = endTime.toTimeString().slice(0, 5);
    }

    // Get payment information
    let paymentStatus = '';
    let paymentAmount = '';
    
    try {
      const { data: payment } = await supabase
        .from('booking_payments')
        .select('status, amount_cents')
        .eq('booking_id', booking_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (payment) {
        paymentStatus = payment.status === 'succeeded' ? 'Paid' : 
                      payment.status === 'pending' ? 'Pending' : 
                      payment.status === 'failed' ? 'Failed' : '';
        if (payment.amount_cents) {
          paymentAmount = `$${(payment.amount_cents / 100).toFixed(2)}`;
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch payment details:', error);
    }

    // Prepare template variables
    const templateVariables: TemplateVariables = {
      guest_name: booking.guest_name,
      venue_name: venue.name,
      booking_date: new Date(booking.booking_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      booking_time: booking.booking_time,
      booking_end_time: bookingEndTime,
      service: booking.service || 'Dinner',
      party_size: `${booking.party_size} ${booking.party_size === 1 ? 'guest' : 'guests'}`,
      booking_reference: booking.booking_reference,
      payment_status: paymentStatus,
      payment_amount: paymentAmount,
      email_signature: emailSettings.email_signature || `Best regards,\n${venue.name} Team`,
      cancel_link: cancelLink,
      modify_link: modifyLink,
    };

    console.log('📝 Template variables prepared for:', email_type);

    // Try to get custom template
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', email_type)
      .eq('venue_id', venue_id)
      .eq('is_active', true)
      .single();

    let subject: string;
    let html: string;

    if (template) {
      console.log('📄 Using custom template');
      subject = replaceVariables(template.subject, templateVariables);
      html = replaceVariables(template.html_content, templateVariables);
    } else {
      console.log('📄 Using fallback template');
      // Fallback to hardcoded template
      subject = `Booking Confirmation - ${venue.name}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #000; margin: 20px 0;">${venue.name}</h2>
            <p style="color: #666; margin: 5px 0;">Booking Confirmation</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
            <h2 style="color: #000; margin-top: 0;">Your booking is confirmed!</h2>
            <p>Dear ${templateVariables.guest_name},</p>
            <p>Thank you for your booking at ${templateVariables.venue_name}.</p>
            
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd;">
              <h3 style="margin-top: 0; color: #000;">Booking Details</h3>
              <p><strong>Reference:</strong> ${templateVariables.booking_reference}</p>
              <p><strong>Service:</strong> ${templateVariables.service}</p>
              <p><strong>Date:</strong> ${templateVariables.booking_date}</p>
              <p><strong>Time:</strong> ${templateVariables.booking_time}${templateVariables.booking_end_time ? ' - ' + templateVariables.booking_end_time : ''}</p>
              <p><strong>Party Size:</strong> ${templateVariables.party_size}</p>
              <p><strong>Venue:</strong> ${templateVariables.venue_name}</p>
              ${templateVariables.payment_status ? `<p><strong>Payment:</strong> ${templateVariables.payment_status}${templateVariables.payment_amount ? ' (' + templateVariables.payment_amount + ')' : ''}</p>` : ''}
            </div>
            
            ${templateVariables.cancel_link || templateVariables.modify_link ? `
            <div style="text-align: center; margin: 20px 0;">
              ${templateVariables.modify_link ? `<a href="${templateVariables.modify_link}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Booking</a>` : ''}
              ${templateVariables.cancel_link ? `<a href="${templateVariables.cancel_link}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>` : ''}
            </div>
            ` : ''}
            
            <p>We look forward to seeing you!</p>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
            <p style="white-space: pre-line;">${templateVariables.email_signature}</p>
            <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
          </div>
        </div>
      `;
    }

    // Send the email
    const fromAddress = emailSettings.from_name && emailSettings.from_email
      ? `${emailSettings.from_name} <${emailSettings.from_email}>`
      : emailSettings.from_email || `${venue.name} <noreply@grace-os.co.uk>`;

    console.log('📧 Sending email from:', fromAddress, 'to:', guest_email);

    const emailResponse = await resend.emails.send({
      from: fromAddress,
      to: [guest_email],
      subject,
      html,
    });

    console.log('✅ Booking email sent successfully:', emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('❌ Error in handleBookingEmail:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}

function replaceVariables(content: string, variables: TemplateVariables): string {
  let processedContent = content;
  
  // Replace all {{variable}} placeholders with actual values
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    processedContent = processedContent.replace(regex, value || '');
  });
  
  return processedContent;
}

function generateToken(): string {
  // Generate a random 32-character token
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

serve(handler);
