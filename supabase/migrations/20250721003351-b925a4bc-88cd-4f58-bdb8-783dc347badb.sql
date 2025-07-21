-- Fix the create_default_email_templates function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.create_default_email_templates(p_venue_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  venue_record RECORD;
BEGIN
  -- Get venue info
  SELECT name INTO venue_record FROM public.venues WHERE id = p_venue_id;
  
  -- Insert default templates if they don't exist
  INSERT INTO public.email_templates (venue_id, template_key, template_type, subject, html_content, description, is_active, auto_send)
  VALUES 
    (p_venue_id, 'booking_confirmation', 'venue', 
     'Booking Confirmation - ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>
          <p style="color: #64748b; margin: 5px 0;">Booking Confirmation</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Your booking is confirmed!</h2>
          <p>Dear {{guest_name}},</p>
          <p>Thank you for your booking at {{venue_name}}.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ea580c;">Booking Details</h3>
            <p><strong>Reference:</strong> {{booking_reference}}</p>
            <p><strong>Date:</strong> {{booking_date}}</p>
            <p><strong>Time:</strong> {{booking_time}}</p>
            <p><strong>Party Size:</strong> {{party_size}}</p>
            <p><strong>Venue:</strong> {{venue_name}}</p>
          </div>
          <p>We look forward to seeing you!</p>
        </div>
      </div>',
     'Sent immediately after a booking is confirmed',
     true, true),
     
    (p_venue_id, 'booking_reminder_24h', 'venue',
     'Booking Reminder - Tomorrow at ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>
          <p style="color: #64748b; margin: 5px 0;">Booking Reminder</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Your booking is tomorrow!</h2>
          <p>Dear {{guest_name}},</p>
          <p>This is a friendly reminder about your booking at {{venue_name}} tomorrow.</p>
        </div>
      </div>',
     'Sent 24 hours before the booking',
     true, false),
     
    (p_venue_id, 'booking_reminder_2h', 'venue',
     'Booking Reminder - In 2 Hours at ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>
          <p style="color: #64748b; margin: 5px 0;">Booking Reminder</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Your booking is in 2 hours!</h2>
          <p>Dear {{guest_name}},</p>
          <p>Your booking at {{venue_name}} is coming up in just 2 hours.</p>
        </div>
      </div>',
     'Sent 2 hours before the booking',
     true, false),
     
    (p_venue_id, 'booking_cancelled', 'venue',
     'Booking Cancelled - ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>
          <p style="color: #64748b; margin: 5px 0;">Booking Cancelled</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Your booking has been cancelled</h2>
          <p>Dear {{guest_name}},</p>
          <p>Your booking at {{venue_name}} has been cancelled as requested.</p>
        </div>
      </div>',
     'Sent when a booking is cancelled',
     true, true),
     
    (p_venue_id, 'booking_modified', 'venue',
     'Booking Modified - ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>
          <p style="color: #64748b; margin: 5px 0;">Booking Modified</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Your booking has been updated</h2>
          <p>Dear {{guest_name}},</p>
          <p>Your booking at {{venue_name}} has been successfully updated.</p>
        </div>
      </div>',
     'Sent when a booking is modified',
     true, true),
     
    (p_venue_id, 'booking_no_show', 'venue',
     'Missed Booking - ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>
          <p style="color: #64748b; margin: 5px 0;">Missed Booking</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">We missed you today</h2>
          <p>Dear {{guest_name}},</p>
          <p>We noticed you weren''t able to make it to your booking at {{venue_name}} today.</p>
        </div>
      </div>',
     'Sent when a booking is marked as no-show',
     true, false),
     
    (p_venue_id, 'walk_in_confirmation', 'venue',
     'Walk-in Confirmation - ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>
          <p style="color: #64748b; margin: 5px 0;">Walk-in Confirmation</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Thanks for visiting us!</h2>
          <p>Dear {{guest_name}},</p>
          <p>Thank you for visiting {{venue_name}} today as a walk-in guest.</p>
        </div>
      </div>',
     'Sent when a walk-in visit is recorded',
     true, false)
  ON CONFLICT (venue_id, template_key) DO NOTHING;
END;
$function$;