import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  reminder_type: "24h" | "2h";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reminder_type }: ReminderRequest = await req.json();
    console.log(`Processing ${reminder_type} reminders...`);

    // Calculate the target datetime for reminders
    const now = new Date();
    let targetTime: Date;
    
    if (reminder_type === "24h") {
      // Find bookings happening in 24 hours (within a 1-hour window)
      targetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else {
      // Find bookings happening in 2 hours (within a 30-minute window)
      targetTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    }

    const windowStart = new Date(targetTime.getTime() - (reminder_type === "24h" ? 30 : 15) * 60 * 1000);
    const windowEnd = new Date(targetTime.getTime() + (reminder_type === "24h" ? 30 : 15) * 60 * 1000);

    // Get bookings that need reminders
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        guest_name,
        email,
        booking_reference,
        service,
        booking_date,
        booking_time,
        end_time,
        party_size,
        duration_minutes,
        venue_id,
        venues!inner(name)
      `)
      .eq('status', 'confirmed')
      .gte('booking_date', windowStart.toISOString().split('T')[0])
      .lte('booking_date', windowEnd.toISOString().split('T')[0])
      .not('email', 'is', null);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      throw bookingsError;
    }

    console.log(`Found ${bookings?.length || 0} potential bookings for ${reminder_type} reminders`);

    let sentCount = 0;
    const errors: string[] = [];

    for (const booking of bookings || []) {
      try {
        // Check if we already sent this reminder
        const { data: existingReminder } = await supabase
          .from('reminder_log')
          .select('id')
          .eq('booking_id', booking.id)
          .eq('reminder_type', reminder_type)
          .single();

        if (existingReminder) {
          console.log(`Reminder already sent for booking ${booking.booking_reference}`);
          continue;
        }

        // Calculate exact booking datetime
        const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
        const timeDiff = bookingDateTime.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // Check if this booking is in the right time window
        if (reminder_type === "24h" && (hoursDiff < 23 || hoursDiff > 25)) {
          continue;
        }
        if (reminder_type === "2h" && (hoursDiff < 1.5 || hoursDiff > 2.5)) {
          continue;
        }

        // Calculate end time
        const endTime = booking.end_time || 
          new Date(bookingDateTime.getTime() + (booking.duration_minutes || 120) * 60 * 1000)
            .toTimeString().slice(0, 5);

        // Get venue settings for email signature
        const { data: venueSettings } = await supabase
          .from('venue_settings')
          .select('setting_value')
          .eq('venue_id', booking.venue_id)
          .eq('setting_key', 'email_signature')
          .single();

        const emailSignature = venueSettings?.setting_value || `Best regards,\n${booking.venues.name} Team`;

        // Generate booking tokens for cancel/modify links
        const { data: cancelTokenData } = await supabase
          .from('booking_tokens')
          .insert({
            booking_id: booking.id,
            token_type: 'cancel',
            token: crypto.randomUUID(),
          })
          .select('token')
          .single();

        const { data: modifyTokenData } = await supabase
          .from('booking_tokens')
          .insert({
            booking_id: booking.id,
            token_type: 'modify',
            token: crypto.randomUUID(),
          })
          .select('token')
          .single();

        // Get email template
        const templateKey = `booking_reminder_${reminder_type}`;
        const { data: template, error: templateError } = await supabase
          .from('email_templates')
          .select('*')
          .eq('template_key', templateKey)
          .eq('venue_id', booking.venue_id)
          .eq('is_active', true)
          .single();

        if (templateError || !template) {
          console.error(`Template ${templateKey} not found for venue ${booking.venue_id}`);
          errors.push(`Template not found for booking ${booking.booking_reference}`);
          continue;
        }

        // Prepare template variables
        const variables = {
          guest_name: booking.guest_name,
          venue_name: booking.venues.name,
          booking_reference: booking.booking_reference,
          service: booking.service || 'Dinner',
          booking_date: new Date(booking.booking_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          booking_time: booking.booking_time,
          booking_end_time: endTime,
          party_size: `${booking.party_size} ${booking.party_size === 1 ? 'guest' : 'guests'}`,
          email_signature: emailSignature,
          cancel_link: `${supabaseUrl.replace('/rest/v1', '')}/cancel-booking?token=${cancelTokenData?.token}`,
          modify_link: `${supabaseUrl.replace('/rest/v1', '')}/modify-booking?token=${modifyTokenData?.token}`,
        };

        // Replace variables in template
        let emailContent = template.html_content;
        let emailSubject = template.subject;

        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          emailContent = emailContent.replace(regex, value);
          emailSubject = emailSubject.replace(regex, value);
        });

        // Get venue email for "from" address
        const { data: venue } = await supabase
          .from('venues')
          .select('email, name')
          .eq('id', booking.venue_id)
          .single();

        const fromEmail = venue?.email || 'noreply@grace-os.co.uk';
        const fromName = venue?.name || 'Restaurant';

        // Send email
        const emailResponse = await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: [booking.email],
          subject: emailSubject,
          html: emailContent,
        });

        if (emailResponse.error) {
          console.error(`Failed to send reminder to ${booking.email}:`, emailResponse.error);
          errors.push(`Failed to send to ${booking.email}: ${emailResponse.error}`);
          continue;
        }

        // Log the reminder
        await supabase
          .from('reminder_log')
          .insert({
            booking_id: booking.id,
            reminder_type: reminder_type,
            venue_id: booking.venue_id,
          });

        sentCount++;
        console.log(`Sent ${reminder_type} reminder for booking ${booking.booking_reference} to ${booking.email}`);

      } catch (error) {
        console.error(`Error processing booking ${booking.booking_reference}:`, error);
        errors.push(`Error processing ${booking.booking_reference}: ${error.message}`);
      }
    }

    console.log(`Reminder job completed. Sent: ${sentCount}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        sent_count: sentCount,
        errors: errors,
        reminder_type: reminder_type,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-reminder-emails function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        reminder_type: (await req.json())?.reminder_type || 'unknown'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);