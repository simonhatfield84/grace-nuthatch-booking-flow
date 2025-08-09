
-- Update the payment_request email template with professional HTML matching booking confirmation style
UPDATE public.email_templates 
SET 
  html_content = '<div style="font-family: ''Cabin'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="text-align: center; margin-bottom: 30px; padding: 20px 0;">
      <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
      <p style="color: #64748b; margin: 5px 0; font-size: 14px;">Payment Request</p>
    </div>
    
    <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px;">
      <h2 style="color: #1e293b; margin-top: 0; font-family: ''Cabin'', sans-serif; font-size: 24px; font-weight: 600;">Payment Required</h2>
      <p style="color: #334155; font-size: 16px; line-height: 1.5; margin: 16px 0;">Dear {{guest_name}},</p>
      <p style="color: #334155; font-size: 16px; line-height: 1.5; margin: 16px 0;">We require payment for your upcoming booking at {{venue_name}}.</p>
      
      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0; color: #1e293b; font-family: ''Cabin'', sans-serif; font-size: 18px; font-weight: 600;">Booking Details</h3>
        <p style="margin: 8px 0; color: #475569;"><strong>Reference:</strong> {{booking_reference}}</p>
        <p style="margin: 8px 0; color: #475569;"><strong>Date:</strong> {{booking_date}}</p>
        <p style="margin: 8px 0; color: #475569;"><strong>Time:</strong> {{booking_time}}</p>
        <p style="margin: 8px 0; color: #475569;"><strong>Party Size:</strong> {{party_size}}</p>
        <p style="margin: 8px 0; color: #475569;"><strong>Service:</strong> {{service}}</p>
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0; color: #1e293b; font-family: ''Cabin'', sans-serif; font-size: 18px; font-weight: 600;">Payment Information</h3>
        <p style="margin: 8px 0; color: #475569;"><strong>Amount Due:</strong> {{payment_amount}}</p>
      </div>
      
      {{#custom_message}}
      <div style="background: #fef7cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #eab308;">
        <h4 style="margin-top: 0; color: #713f12; font-family: ''Cabin'', sans-serif; font-size: 16px; font-weight: 600;">Message from {{venue_name}}</h4>
        <p style="color: #713f12; font-size: 14px; line-height: 1.5; margin: 8px 0;">{{custom_message}}</p>
      </div>
      {{/custom_message}}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{payment_link}}" style="background: #000000; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; font-family: ''Cabin'', sans-serif;">Complete Payment Now</a>
      </div>
      
      <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="color: #dc2626; font-size: 14px; margin: 0; font-weight: 500;">⏰ Important: This payment request expires in 24 hours. Please complete your payment promptly to secure your booking.</p>
      </div>
      
      <p style="color: #334155; font-size: 16px; line-height: 1.5; margin: 16px 0;">If you have any questions about this payment request, please don''t hesitate to contact us.</p>
    </div>
    
    <div style="text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; padding: 20px;">
      <p style="white-space: pre-line; margin: 0;">{{email_signature}}</p>
      <p style="margin-top: 20px; font-size: 10px; color: #94a3b8;">Powered by Grace</p>
    </div>
  </div>',
  subject = 'Payment Required - {{venue_name}}',
  updated_at = now()
WHERE template_key = 'payment_request';

-- Insert the template if it doesn't exist (fallback)
INSERT INTO public.email_templates (
  venue_id, 
  template_key, 
  template_type, 
  subject, 
  html_content, 
  description, 
  is_active, 
  auto_send
)
SELECT 
  v.id,
  'payment_request',
  'venue',
  'Payment Required - ' || v.name,
  '<div style="font-family: ''Cabin'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="text-align: center; margin-bottom: 30px; padding: 20px 0;">
      <img src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" alt="The Nuthatch" style="height: 60px; width: auto; margin: 20px 0;" />
      <p style="color: #64748b; margin: 5px 0; font-size: 14px;">Payment Request</p>
    </div>
    
    <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px;">
      <h2 style="color: #1e293b; margin-top: 0; font-family: ''Cabin'', sans-serif; font-size: 24px; font-weight: 600;">Payment Required</h2>
      <p style="color: #334155; font-size: 16px; line-height: 1.5; margin: 16px 0;">Dear {{guest_name}},</p>
      <p style="color: #334155; font-size: 16px; line-height: 1.5; margin: 16px 0;">We require payment for your upcoming booking at {{venue_name}}.</p>
      
      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0; color: #1e293b; font-family: ''Cabin'', sans-serif; font-size: 18px; font-weight: 600;">Booking Details</h3>
        <p style="margin: 8px 0; color: #475569;"><strong>Reference:</strong> {{booking_reference}}</p>
        <p style="margin: 8px 0; color: #475569;"><strong>Date:</strong> {{booking_date}}</p>
        <p style="margin: 8px 0; color: #475569;"><strong>Time:</strong> {{booking_time}}</p>
        <p style="margin: 8px 0; color: #475569;"><strong>Party Size:</strong> {{party_size}}</p>
        <p style="margin: 8px 0; color: #475569;"><strong>Service:</strong> {{service}}</p>
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0; color: #1e293b; font-family: ''Cabin'', sans-serif; font-size: 18px; font-weight: 600;">Payment Information</h3>
        <p style="margin: 8px 0; color: #475569;"><strong>Amount Due:</strong> {{payment_amount}}</p>
      </div>
      
      {{#custom_message}}
      <div style="background: #fef7cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #eab308;">
        <h4 style="margin-top: 0; color: #713f12; font-family: ''Cabin'', sans-serif; font-size: 16px; font-weight: 600;">Message from {{venue_name}}</h4>
        <p style="color: #713f12; font-size: 14px; line-height: 1.5; margin: 8px 0;">{{custom_message}}</p>
      </div>
      {{/custom_message}}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{payment_link}}" style="background: #000000; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; font-family: ''Cabin'', sans-serif;">Complete Payment Now</a>
      </div>
      
      <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="color: #dc2626; font-size: 14px; margin: 0; font-weight: 500;">⏰ Important: This payment request expires in 24 hours. Please complete your payment promptly to secure your booking.</p>
      </div>
      
      <p style="color: #334155; font-size: 16px; line-height: 1.5; margin: 16px 0;">If you have any questions about this payment request, please don''t hesitate to contact us.</p>
    </div>
    
    <div style="text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; padding: 20px;">
      <p style="white-space: pre-line; margin: 0;">{{email_signature}}</p>
      <p style="margin-top: 20px; font-size: 10px; color: #94a3b8;">Powered by Grace</p>
    </div>
  </div>',
  'Sent when payment is required for a booking made by staff',
  true,
  false
FROM public.venues v
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_templates 
  WHERE template_key = 'payment_request' AND venue_id = v.id
);
