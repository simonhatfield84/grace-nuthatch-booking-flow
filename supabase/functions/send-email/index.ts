import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { Resend } from "npm:resend@2.0.0";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { requireEnv } from '../_shared/envValidator.ts';

let resend: any = null;

// Lazy initialize Resend
function getResend() {
  if (!resend) {
    requireEnv(['RESEND_API_KEY']);
    resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  }
  return resend;
}

// Input validation schemas
const directEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  from: z.string().optional(),
  from_name: z.string().max(100).optional(),
  from_email: z.string().email().optional(),
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
  text: z.string().optional(),
});

const bookingEmailSchema = z.object({
  booking_id: z.number().int().positive(),
  guest_email: z.string().email(),
  venue_id: z.string().uuid(),
  email_type: z.string().max(50).optional(),
});

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
  first_name: string;
  last_name: string;
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

// Utility function to format time from 24-hour to 12-hour format
function formatTime(timeString: string): string {
  if (!timeString) return '';
  
  // Remove seconds if present (e.g., "21:00:00" -> "21:00")
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
}

// Utility function to split full name into first and last name
function splitName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: '', lastName: '' };
  
  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' };
  } else if (nameParts.length === 2) {
    return { firstName: nameParts[0], lastName: nameParts[1] };
  } else {
    // More than 2 parts - first word is first name, rest is last name
    return { 
      firstName: nameParts[0], 
      lastName: nameParts.slice(1).join(' ') 
    };
  }
}

// Utility function to format currency amount
function formatCurrency(amountCents: number, currencyCode: string = 'GBP'): string {
  const amount = amountCents / 100;
  
  if (currencyCode === 'GBP') {
    return `£${amount.toFixed(2)}`;
  } else if (currencyCode === 'USD') {
    return `$${amount.toFixed(2)}`;
  } else if (currencyCode === 'EUR') {
    return `€${amount.toFixed(2)}`;
  } else {
    // Default to GBP for UK venues
    return `£${amount.toFixed(2)}`;
  }
}

const handler = async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  const corsH = getCorsHeaders(req);

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
      // Validate booking email request
      const validationResult = bookingEmailSchema.safeParse(requestBody);
      if (!validationResult.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid booking email parameters',
            details: validationResult.error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            })),
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      console.log('📧 Processing booking email request:', {
        booking_id: requestBody.booking_id,
        guest_email: requestBody.guest_email,
        venue_id: requestBody.venue_id,
        email_type: requestBody.email_type
      });

      return await handleBookingEmail(supabase, validationResult.data, req);
    }

    // Handle direct email requests (legacy)
    // Validate direct email request
    const directValidation = directEmailSchema.safeParse(requestBody);
    if (!directValidation.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid email parameters',
          details: directValidation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          })),
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    const { 
      to, 
      from, 
      from_name, 
      from_email, 
      subject, 
      html, 
      text 
    } = directValidation.data;

    // Get platform settings for from address
    let fromAddress: string;
    if (from) {
      fromAddress = from;
    } else if (from_name && from_email) {
      fromAddress = `${from_name} <${from_email}>`;
    } else {
      // Get from platform settings
      const { data: platformSettings } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'from_email')
        .single();
      
      const { data: platformName } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'from_name')
        .single();

      const defaultFromEmail = platformSettings?.setting_value 
        ? JSON.parse(platformSettings.setting_value) 
        : 'nuthatch@grace-os.co.uk';
      
      const defaultFromName = platformName?.setting_value 
        ? JSON.parse(platformName.setting_value) 
        : 'Grace OS';

      fromAddress = from_email || from_name 
        ? `${from_name || defaultFromName} <${from_email || defaultFromEmail}>` 
        : `${defaultFromName} <${defaultFromEmail}>`;
    }

    console.log(`📧 Sending email from: ${fromAddress} to: ${Array.isArray(to) ? to.join(', ') : to}`);

    try {
      const emailService = getResend();
      const emailResponse = await emailService.emails.send({
        from: fromAddress,
        to: Array.isArray(to) ? to : [to!],
        subject: subject!,
        html: html!,
        text,
      });

      console.log("📧 Resend response:", emailResponse);

      // Check for Resend errors
      if (emailResponse.error) {
        console.error("❌ Resend provider error:", emailResponse.error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Email service error',
          details: emailResponse.error.message || String(emailResponse.error)
        }), {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsH },
        });
      }

      if (!emailResponse.data || !emailResponse.data.id) {
        console.error("❌ No email ID returned from Resend");
        return new Response(JSON.stringify({
          success: false,
          error: 'Email sending failed - no confirmation received'
        }), {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsH },
        });
      }

      console.log("✅ Email sent successfully with ID:", emailResponse.data.id);

      return new Response(JSON.stringify({
        success: true,
        id: emailResponse.data.id,
        ...emailResponse
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsH,
        },
      });
    } catch (providerError: any) {
      console.error("❌ Email provider error:", providerError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Email service unavailable',
        details: providerError.message
      }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsH },
      });
    }
  } catch (error: any) {
    console.error("❌ Error in send-email function:", error);
    const corsH = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error',
        details: error.stack 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsH },
      }
    );
  }
};

async function handleBookingEmail(supabase: any, request: SendEmailRequest, req: Request): Promise<Response> {
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

    // Get platform email settings for from address
    const { data: platformSettings } = await supabase
      .from('platform_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['from_email', 'from_name']);

    const emailSettings: Record<string, string> = {};
    platformSettings?.forEach(setting => {
      try {
        const parsedValue = typeof setting.setting_value === 'string' 
          ? JSON.parse(setting.setting_value) 
          : setting.setting_value;
        emailSettings[setting.setting_key] = String(parsedValue || '');
      } catch {
        emailSettings[setting.setting_key] = String(setting.setting_value || '');
      }
    });

    // Use platform settings with fallback
    const defaultFromEmail = emailSettings.from_email || 'nuthatch@grace-os.co.uk';
    const defaultFromName = emailSettings.from_name || 'Grace OS';

    // Get venue-specific email settings
    const { data: venueSettings } = await supabase
      .from('venue_settings')
      .select('setting_key, setting_value')
      .eq('venue_id', venue_id)
      .in('setting_key', ['from_email', 'from_name', 'email_signature', 'currency']);

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

    console.log('⚙️ Email settings retrieved:', { platform: Object.keys(emailSettings), venue: Object.keys(venueEmailSettings) });

    // Generate booking tokens for cancel/modify links
    let cancelLink = '';
    let modifyLink = '';
    
    try {
      // Use the database function for consistent token generation
      const { data: cancelTokenResult, error: cancelTokenError } = await supabase
        .rpc('generate_booking_token');
        
      if (cancelTokenError) throw cancelTokenError;

      const { data: cancelTokenData, error: cancelError } = await supabase
        .from('booking_tokens')
        .insert({
          booking_id: booking_id,
          token_type: 'cancel',
          token: cancelTokenResult,
          venue_id: venue_id,
        })
        .select('token')
        .single();

      if (!cancelError && cancelTokenData) {
        // Generate proper base URL for booking links
        const origin = req.headers.get('origin');
        const referer = req.headers.get('referer');
        let baseUrl = 'https://graceful-kangaroo-afa6b6.netlify.app'; // Default production URL
        
        if (origin) {
          baseUrl = origin;
        } else if (referer) {
          const url = new URL(referer);
          baseUrl = `${url.protocol}//${url.host}`;
        }
        
        cancelLink = `${baseUrl}/cancel-booking?token=${cancelTokenData.token}`;
        console.log('🔗 Generated cancel link:', cancelLink);
      }

      const { data: modifyTokenResult, error: modifyTokenError } = await supabase
        .rpc('generate_booking_token');
        
      if (modifyTokenError) throw modifyTokenError;

      const { data: modifyTokenData, error: modifyError } = await supabase
        .from('booking_tokens')
        .insert({
          booking_id: booking_id,
          token_type: 'modify',
          token: modifyTokenResult,
          venue_id: venue_id,
        })
        .select('token')
        .single();

      if (!modifyError && modifyTokenData) {
        // Generate proper base URL for booking links
        const origin = req.headers.get('origin');
        const referer = req.headers.get('referer');
        let baseUrl = 'https://graceful-kangaroo-afa6b6.netlify.app'; // Default production URL
        
        if (origin) {
          baseUrl = origin;
        } else if (referer) {
          const url = new URL(referer);
          baseUrl = `${url.protocol}//${url.host}`;
        }
        
        modifyLink = `${baseUrl}/modify-booking?token=${modifyTokenData.token}`;
        console.log('🔗 Generated modify link:', modifyLink);
      }
    } catch (error) {
      console.error('❌ Failed to generate booking tokens:', error);
      console.error('Token generation error details:', error);
    }
    
    console.log('🔗 Final links generated:', { cancelLink, modifyLink });

    // Calculate end time
    let bookingEndTime = '';
    if (booking.end_time) {
      bookingEndTime = formatTime(booking.end_time);
    } else if (booking.duration_minutes) {
      const [hours, minutes] = booking.booking_time.split(':').map(Number);
      const startTime = new Date();
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(startTime.getTime() + booking.duration_minutes * 60000);
      bookingEndTime = formatTime(endTime.toTimeString().slice(0, 5));
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
          const currency = emailSettings.currency || 'GBP';
          paymentAmount = formatCurrency(payment.amount_cents, currency);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch payment details:', error);
    }

    // Split guest name into first and last name
    const { firstName, lastName } = splitName(booking.guest_name);

    // Prepare template variables
    const templateVariables: TemplateVariables = {
      guest_name: booking.guest_name,
      first_name: firstName,
      last_name: lastName,
      venue_name: venue.name,
      booking_date: new Date(booking.booking_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      booking_time: formatTime(booking.booking_time),
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
            <p>Dear ${templateVariables.first_name},</p>
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

    // Send the email with proper error handling
    const fromAddress = venueEmailSettings.from_name && venueEmailSettings.from_email
      ? `${venueEmailSettings.from_name} <${venueEmailSettings.from_email}>`
      : venueEmailSettings.from_email || `${venue.name} <${defaultFromEmail}>`;

    console.log('📧 Sending email from:', fromAddress, 'to:', guest_email);

    const emailResponse = await resend.emails.send({
      from: fromAddress,
      to: [guest_email],
      subject,
      html,
    });

    console.log('📧 Resend response:', emailResponse);

    // Check for Resend errors
    if (emailResponse.error) {
      console.error("❌ Resend error:", emailResponse.error);
      throw new Error(`Email delivery failed: ${emailResponse.error.message || emailResponse.error}`);
    }

    if (!emailResponse.data || !emailResponse.data.id) {
      console.error("❌ No email ID returned from Resend");
      throw new Error("Email sending failed - no confirmation ID received");
    }

    console.log('✅ Booking email sent successfully with ID:', emailResponse.data.id);

    return new Response(JSON.stringify({
      success: true,
      id: emailResponse.data.id,
      ...emailResponse
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('❌ Error in handleBookingEmail:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: error.stack 
      }),
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

serve(handler);
