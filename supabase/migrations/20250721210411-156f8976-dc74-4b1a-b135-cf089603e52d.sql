-- Add design_json column to email_templates table for storing Unlayer JSON designs
ALTER TABLE public.email_templates 
ADD COLUMN design_json jsonb DEFAULT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.email_templates.design_json IS 'Stores Unlayer editor design JSON for visual email editing';