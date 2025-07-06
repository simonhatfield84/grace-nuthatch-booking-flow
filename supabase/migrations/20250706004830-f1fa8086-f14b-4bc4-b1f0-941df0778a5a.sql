
-- Add email branding settings to platform_settings
INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, description, is_public) 
VALUES 
  ('from_name', '"Grace OS"', 'string', 'Default from name for platform emails', false),
  ('email_logo_url', '""', 'string', 'Logo URL for email templates', false),
  ('email_primary_color', '"#ea580c"', 'string', 'Primary brand color for emails', false),
  ('email_secondary_color', '"#1e293b"', 'string', 'Secondary brand color for emails', false)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description;

-- Insert default email templates for Grace OS branding
INSERT INTO public.email_templates (template_key, subject, html_content, template_type, text_content)
VALUES 
(
  'password_reset', 
  'Reset Your Grace OS Password',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>
    <p style="color: #64748b; margin: 5px 0;">Hospitality Management Platform</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
    <h2 style="color: #1e293b; margin-top: 0;">Reset Your Password</h2>
    <p>Hello {{name}},</p>
    <p>We received a request to reset your password for your Grace OS account. Click the button below to create a new password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{reset_link}}" style="background: #ea580c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
    </div>
    
    <p>If the button doesn''t work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #ea580c;">{{reset_link}}</p>
    
    <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
      This link will expire in 24 hours. If you didn''t request this password reset, please ignore this email.
    </p>
  </div>
  
  <div style="text-align: center; color: #94a3b8; font-size: 12px;">
    <p>Best regards,<br>Fred at Grace OS</p>
    <p>© 2024 Grace OS. All rights reserved.</p>
  </div>
</body>
</html>',
  'platform',
  'Reset Your Grace OS Password

Hello {{name}},

We received a request to reset your password for your Grace OS account. 

Please visit this link to create a new password:
{{reset_link}}

This link will expire in 24 hours. If you didn''t request this password reset, please ignore this email.

Best regards,
Fred at Grace OS

© 2024 Grace OS. All rights reserved.'
),
(
  'welcome_email',
  'Welcome to Grace OS',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Grace OS</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #ea580c; font-size: 32px; margin: 0;">grace</h1>
    <p style="color: #64748b; margin: 5px 0;">Hospitality Management Platform</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
    <h2 style="color: #1e293b; margin-top: 0;">Welcome to Grace OS!</h2>
    <p>Hello {{name}},</p>
    <p>Welcome to Grace OS, the modern hospitality management platform designed to streamline your venue operations.</p>
    
    <div style="margin: 25px 0;">
      <h3 style="color: #ea580c; margin-bottom: 10px;">What''s Next?</h3>
      <ul style="padding-left: 20px;">
        <li>Complete your venue setup</li>
        <li>Configure your table layout</li>
        <li>Start managing bookings</li>
        <li>Explore our advanced features</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboard_link}}" style="background: #ea580c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Get Started</a>
    </div>
  </div>
  
  <div style="text-align: center; color: #94a3b8; font-size: 12px;">
    <p>Best regards,<br>Fred at Grace OS</p>
    <p>© 2024 Grace OS. All rights reserved.</p>
  </div>
</body>
</html>',
  'platform',
  'Welcome to Grace OS!

Hello {{name}},

Welcome to Grace OS, the modern hospitality management platform designed to streamline your venue operations.

What''s Next?
- Complete your venue setup
- Configure your table layout  
- Start managing bookings
- Explore our advanced features

Get started: {{dashboard_link}}

Best regards,
Fred at Grace OS

© 2024 Grace OS. All rights reserved.'
)
ON CONFLICT (template_key) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  updated_at = now();
