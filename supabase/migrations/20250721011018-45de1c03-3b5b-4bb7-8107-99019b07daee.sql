
-- Add reminder tracking table to prevent duplicate reminders
CREATE TABLE public.reminder_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  reminder_type TEXT NOT NULL, -- '24h' or '2h'
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  venue_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for reminder_log
ALTER TABLE public.reminder_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can create reminder logs" 
  ON public.reminder_log 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Venue users can view their reminder logs" 
  ON public.reminder_log 
  FOR SELECT 
  USING (venue_id = get_user_venue(auth.uid()));

-- Enable pg_cron and pg_net extensions for scheduled reminders
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update email templates to fix branding issues and add new variables
UPDATE public.email_templates 
SET html_content = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="{{venue_name}}" style="height: 60px; width: auto; margin: 20px 0;" onerror="this.style.display=''none''; this.parentNode.innerHTML=''<h2 style=&quot;color: #000; margin: 20px 0;&quot;>{{venue_name}}</h2>'';" />
    <p style="color: #666; margin: 5px 0;">Booking Confirmation</p>
  </div>
  <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h2 style="color: #000; margin-top: 0;">Your booking is confirmed!</h2>
    <p>Dear {{guest_name}},</p>
    <p>Thank you for your booking at {{venue_name}}.</p>
    <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd;">
      <h3 style="margin-top: 0; color: #000;">Booking Details</h3>
      <p><strong>Reference:</strong> {{booking_reference}}</p>
      <p><strong>Service:</strong> {{service}}</p>
      <p><strong>Date:</strong> {{booking_date}}</p>
      <p><strong>Time:</strong> {{booking_time}} - {{booking_end_time}}</p>
      <p><strong>Party Size:</strong> {{party_size}}</p>
      <p><strong>Venue:</strong> {{venue_name}}</p>
      {{#if payment_status}}
      <p><strong>Payment:</strong> {{payment_status}} {{#if payment_amount}}({{payment_amount}}){{/if}}</p>
      {{/if}}
    </div>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{modify_link}}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Booking</a>
      <a href="{{cancel_link}}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>
    </div>
    <p>We look forward to seeing you!</p>
  </div>
  <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
    <p style="white-space: pre-line;">{{email_signature}}</p>
    <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
  </div>
</div>'
WHERE template_key = 'booking_confirmation';

-- Update reminder templates with new variables
UPDATE public.email_templates 
SET html_content = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="{{venue_name}}" style="height: 60px; width: auto; margin: 20px 0;" onerror="this.style.display=''none''; this.parentNode.innerHTML=''<h2 style=&quot;color: #000; margin: 20px 0;&quot;>{{venue_name}}</h2>'';" />
    <p style="color: #666; margin: 5px 0;">Booking Reminder</p>
  </div>
  <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h2 style="color: #000; margin-top: 0;">Your booking is tomorrow!</h2>
    <p>Dear {{guest_name}},</p>
    <p>This is a friendly reminder about your booking at {{venue_name}} tomorrow.</p>
    <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd;">
      <h3 style="margin-top: 0; color: #000;">Booking Details</h3>
      <p><strong>Reference:</strong> {{booking_reference}}</p>
      <p><strong>Service:</strong> {{service}}</p>
      <p><strong>Date:</strong> {{booking_date}}</p>
      <p><strong>Time:</strong> {{booking_time}} - {{booking_end_time}}</p>
      <p><strong>Party Size:</strong> {{party_size}}</p>
      <p><strong>Venue:</strong> {{venue_name}}</p>
      {{#if payment_status}}
      <p><strong>Payment:</strong> {{payment_status}} {{#if payment_amount}}({{payment_amount}}){{/if}}</p>
      {{/if}}
    </div>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{modify_link}}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Booking</a>
      <a href="{{cancel_link}}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>
    </div>
    <p>We look forward to seeing you!</p>
  </div>
  <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
    <p style="white-space: pre-line;">{{email_signature}}</p>
    <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
  </div>
</div>'
WHERE template_key = 'booking_reminder_24h';

-- Update 2-hour reminder template
UPDATE public.email_templates 
SET html_content = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="{{venue_name}}" style="height: 60px; width: auto; margin: 20px 0;" onerror="this.style.display=''none''; this.parentNode.innerHTML=''<h2 style=&quot;color: #000; margin: 20px 0;&quot;>{{venue_name}}</h2>'';" />
    <p style="color: #666; margin: 5px 0;">Booking Reminder</p>
  </div>
  <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h2 style="color: #000; margin-top: 0;">Your booking is in 2 hours!</h2>
    <p>Dear {{guest_name}},</p>
    <p>Your booking at {{venue_name}} is coming up in just 2 hours.</p>
    <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd;">
      <h3 style="margin-top: 0; color: #000;">Booking Details</h3>
      <p><strong>Reference:</strong> {{booking_reference}}</p>
      <p><strong>Service:</strong> {{service}}</p>
      <p><strong>Date:</strong> {{booking_date}}</p>
      <p><strong>Time:</strong> {{booking_time}} - {{booking_end_time}}</p>
      <p><strong>Party Size:</strong> {{party_size}}</p>
      <p><strong>Venue:</strong> {{venue_name}}</p>
      {{#if payment_status}}
      <p><strong>Payment:</strong> {{payment_status}} {{#if payment_amount}}({{payment_amount}}){{/if}}</p>
      {{/if}}
    </div>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{modify_link}}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Modify Booking</a>
      <a href="{{cancel_link}}" style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>
    </div>
    <p>We look forward to seeing you soon!</p>
  </div>
  <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
    <p style="white-space: pre-line;">{{email_signature}}</p>
    <p style="margin-top: 20px; font-size: 10px; color: #999;">Powered by Grace</p>
  </div>
</div>'
WHERE template_key = 'booking_reminder_2h';

-- Create cron jobs for reminder emails
SELECT cron.schedule(
  'send-24h-reminders',
  '0 9 * * *', -- Every day at 9 AM
  $$
  SELECT
    net.http_post(
        url:='https://wxyotttvyexxzeaewyga.supabase.co/functions/v1/send-reminder-emails',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4eW90dHR2eWV4eHplYWV3eWdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NTU3NDEsImV4cCI6MjA2NzEzMTc0MX0.QDugoBTZMxFTB79_tD-6Ng4_DYZpSmuCzm3y8yLw34U"}'::jsonb,
        body:='{"reminder_type": "24h"}'::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'send-2h-reminders',
  '0 */2 * * *', -- Every 2 hours
  $$
  SELECT
    net.http_post(
        url:='https://wxyotttvyexxzeaewyga.supabase.co/functions/v1/send-reminder-emails',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4eW90dHR2eWV4eHplYWV3eWdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NTU3NDEsImV4cCI6MjA2NzEzMTc0MX0.QDugoBTZMxFTB79_tD-6Ng4_DYZpSmuCzm3y8yLw34U"}'::jsonb,
        body:='{"reminder_type": "2h"}'::jsonb
    ) as request_id;
  $$
);
