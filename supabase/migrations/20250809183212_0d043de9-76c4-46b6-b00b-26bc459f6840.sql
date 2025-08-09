
-- Remove booking-specific language from the payment request template
UPDATE public.email_templates 
SET 
  html_content = REPLACE(
    html_content,
    'Please complete your payment promptly to secure your booking.',
    'Please complete your payment promptly.'
  ),
  updated_at = now()
WHERE template_key = 'payment_request' 
  AND html_content LIKE '%to secure your booking%';
