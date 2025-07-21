
-- Add columns to email_templates table
ALTER TABLE public.email_templates 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN description TEXT,
ADD COLUMN auto_send BOOLEAN NOT NULL DEFAULT true;

-- Create booking_tokens table for secure cancel/modify links
CREATE TABLE public.booking_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  token_type TEXT NOT NULL, -- 'cancel', 'modify'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on booking_tokens
ALTER TABLE public.booking_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for booking_tokens
CREATE POLICY "Public can use booking tokens" 
  ON public.booking_tokens 
  FOR SELECT 
  USING (expires_at > now() AND used_at IS NULL);

CREATE POLICY "System can create booking tokens" 
  ON public.booking_tokens 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update booking tokens" 
  ON public.booking_tokens 
  FOR UPDATE 
  USING (true);

-- Add indexes for performance
CREATE INDEX idx_booking_tokens_token ON public.booking_tokens(token);
CREATE INDEX idx_booking_tokens_booking_id ON public.booking_tokens(booking_id);
CREATE INDEX idx_booking_tokens_expires_at ON public.booking_tokens(expires_at);

-- Function to generate secure token
CREATE OR REPLACE FUNCTION public.generate_booking_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$;

-- Function to create default email templates for a venue
CREATE OR REPLACE FUNCTION public.create_default_email_templates(p_venue_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
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
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{modify_link}}" style="background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Booking</a>
            <a href="{{cancel_link}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>
          </div>
          <p>We look forward to seeing you!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
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
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ea580c;">Booking Details</h3>
            <p><strong>Reference:</strong> {{booking_reference}}</p>
            <p><strong>Date:</strong> {{booking_date}}</p>
            <p><strong>Time:</strong> {{booking_time}}</p>
            <p><strong>Party Size:</strong> {{party_size}}</p>
            <p><strong>Venue:</strong> {{venue_name}}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{modify_link}}" style="background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Booking</a>
            <a href="{{cancel_link}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>
          </div>
          <p>We look forward to seeing you!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
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
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ea580c;">Booking Details</h3>
            <p><strong>Reference:</strong> {{booking_reference}}</p>
            <p><strong>Date:</strong> {{booking_date}}</p>
            <p><strong>Time:</strong> {{booking_time}}</p>
            <p><strong>Party Size:</strong> {{party_size}}</p>
            <p><strong>Venue:</strong> {{venue_name}}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{modify_link}}" style="background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Booking</a>
            <a href="{{cancel_link}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>
          </div>
          <p>We look forward to seeing you soon!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
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
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ea580c;">Cancelled Booking Details</h3>
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
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ea580c;">Updated Booking Details</h3>
            <p><strong>Reference:</strong> {{booking_reference}}</p>
            <p><strong>Date:</strong> {{booking_date}}</p>
            <p><strong>Time:</strong> {{booking_time}}</p>
            <p><strong>Party Size:</strong> {{party_size}}</p>
            <p><strong>Venue:</strong> {{venue_name}}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{modify_link}}" style="background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Again</a>
            <a href="{{cancel_link}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>
          </div>
          <p>We look forward to seeing you!</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>{{email_signature}}</p>
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
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ea580c;">Missed Booking Details</h3>
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
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ea580c;">Visit Details</h3>
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
        </div>
      </div>',
     'Sent when a walk-in visit is recorded',
     true, false)
  ON CONFLICT (venue_id, template_key) DO NOTHING;
END;
$$;
