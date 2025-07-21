
-- Update all existing email templates with The Nuthatch branding
UPDATE public.email_templates 
SET 
  html_content = REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(html_content, 
            '<h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>',
            '<img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />'
          ),
          '#ea580c', '#000000'
        ),
        '#dc2626', '#000000'
      ),
      '<p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>',
      '<p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>'
    ),
    '</div>',
    '<p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
      </div>'
  ),
  updated_at = NOW()
WHERE template_key IN (
  'booking_confirmation',
  'booking_reminder_24h', 
  'booking_reminder_2h',
  'booking_cancelled',
  'booking_modified',
  'booking_no_show',
  'walk_in_confirmation'
);

-- Update the create_default_email_templates function to use The Nuthatch branding for new venues
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
  
  -- Insert default templates (will be skipped if they already exist due to unique constraint)
  INSERT INTO public.email_templates (venue_id, template_key, template_type, subject, html_content, description, is_active, auto_send)
  VALUES 
    (p_venue_id, 'booking_confirmation', 'venue', 
     'Booking Confirmation - ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #64748b; margin: 5px 0;">Booking Confirmation</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Your booking is confirmed!</h2>
          <p>Dear {{guest_name}},</p>
          <p>Thank you for your booking at {{venue_name}}.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #000000;">Booking Details</h3>
            <p><strong>Reference:</strong> {{booking_reference}}</p>
            <p><strong>Date:</strong> {{booking_date}}</p>
            <p><strong>Time:</strong> {{booking_time}}</p>
            <p><strong>Party Size:</strong> {{party_size}}</p>
            <p><strong>Venue:</strong> {{venue_name}}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{modify_link}}" style="background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Booking</a>
            <a href="{{cancel_link}}" style="background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>
          </div>
          <p>We look forward to seeing you!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>',
     'Sent immediately after a booking is confirmed',
     true, true),
     
    (p_venue_id, 'booking_reminder_24h', 'venue',
     'Booking Reminder - Tomorrow at ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #64748b; margin: 5px 0;">Booking Reminder</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Your booking is tomorrow!</h2>
          <p>Dear {{guest_name}},</p>
          <p>This is a friendly reminder about your booking at {{venue_name}} tomorrow.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #000000;">Booking Details</h3>
            <p><strong>Reference:</strong> {{booking_reference}}</p>
            <p><strong>Date:</strong> {{booking_date}}</p>
            <p><strong>Time:</strong> {{booking_time}}</p>
            <p><strong>Party Size:</strong> {{party_size}}</p>
            <p><strong>Venue:</strong> {{venue_name}}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{modify_link}}" style="background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Booking</a>
            <a href="{{cancel_link}}" style="background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>
          </div>
          <p>We look forward to seeing you!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>',
     'Sent 24 hours before the booking',
     true, false),
     
    (p_venue_id, 'booking_reminder_2h', 'venue',
     'Booking Reminder - In 2 Hours at ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #64748b; margin: 5px 0;">Booking Reminder</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Your booking is in 2 hours!</h2>
          <p>Dear {{guest_name}},</p>
          <p>Your booking at {{venue_name}} is coming up in just 2 hours.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #000000;">Booking Details</h3>
            <p><strong>Reference:</strong> {{booking_reference}}</p>
            <p><strong>Date:</strong> {{booking_date}}</p>
            <p><strong>Time:</strong> {{booking_time}}</p>
            <p><strong>Party Size:</strong> {{party_size}}</p>
            <p><strong>Venue:</strong> {{venue_name}}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{modify_link}}" style="background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Booking</a>
            <a href="{{cancel_link}}" style="background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>
          </div>
          <p>We look forward to seeing you soon!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>',
     'Sent 2 hours before the booking',
     true, false),
     
    (p_venue_id, 'booking_cancelled', 'venue',
     'Booking Cancelled - ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #64748b; margin: 5px 0;">Booking Cancelled</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Your booking has been cancelled</h2>
          <p>Dear {{guest_name}},</p>
          <p>Your booking at {{venue_name}} has been cancelled as requested.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #000000;">Cancelled Booking Details</h3>
            <p><strong>Reference:</strong> {{booking_reference}}</p>
            <p><strong>Date:</strong> {{booking_date}}</p>
            <p><strong>Time:</strong> {{booking_time}}</p>
            <p><strong>Party Size:</strong> {{party_size}}</p>
            <p><strong>Venue:</strong> {{venue_name}}</p>
          </div>
          <p>We hope to see you again soon!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>',
     'Sent when a booking is cancelled',
     true, true),
     
    (p_venue_id, 'booking_modified', 'venue',
     'Booking Modified - ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #64748b; margin: 5px 0;">Booking Modified</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Your booking has been updated</h2>
          <p>Dear {{guest_name}},</p>
          <p>Your booking at {{venue_name}} has been successfully updated.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #000000;">Updated Booking Details</h3>
            <p><strong>Reference:</strong> {{booking_reference}}</p>
            <p><strong>Date:</strong> {{booking_date}}</p>
            <p><strong>Time:</strong> {{booking_time}}</p>
            <p><strong>Party Size:</strong> {{party_size}}</p>
            <p><strong>Venue:</strong> {{venue_name}}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{modify_link}}" style="background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Again</a>
            <a href="{{cancel_link}}" style="background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>
          </div>
          <p>We look forward to seeing you!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>',
     'Sent when a booking is modified',
     true, true),
     
    (p_venue_id, 'booking_no_show', 'venue',
     'Missed Booking - ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #64748b; margin: 5px 0;">Missed Booking</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">We missed you today</h2>
          <p>Dear {{guest_name}},</p>
          <p>We noticed you weren''t able to make it to your booking at {{venue_name}} today.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #000000;">Missed Booking Details</h3>
            <p><strong>Reference:</strong> {{booking_reference}}</p>
            <p><strong>Date:</strong> {{booking_date}}</p>
            <p><strong>Time:</strong> {{booking_time}}</p>
            <p><strong>Party Size:</strong> {{party_size}}</p>
            <p><strong>Venue:</strong> {{venue_name}}</p>
          </div>
          <p>We understand that plans can change. We''d love to welcome you another time!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>',
     'Sent when a booking is marked as no-show',
     true, false),
     
    (p_venue_id, 'walk_in_confirmation', 'venue',
     'Walk-in Confirmation - ' || venue_record.name,
     '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
          <p style="color: #64748b; margin: 5px 0;">Walk-in Confirmation</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Thanks for visiting us!</h2>
          <p>Dear {{guest_name}},</p>
          <p>Thank you for visiting {{venue_name}} today as a walk-in guest.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #000000;">Visit Details</h3>
            <p><strong>Reference:</strong> {{booking_reference}}</p>
            <p><strong>Date:</strong> {{booking_date}}</p>
            <p><strong>Time:</strong> {{booking_time}}</p>
            <p><strong>Party Size:</strong> {{party_size}}</p>
            <p><strong>Venue:</strong> {{venue_name}}</p>
          </div>
          <p>We hope you enjoyed your experience and look forward to welcoming you back soon!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
          <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
        </div>
      </div>',
     'Sent when a walk-in visit is recorded',
     true, false)
  ON CONFLICT (venue_id, template_key) DO NOTHING;
END;
$function$
