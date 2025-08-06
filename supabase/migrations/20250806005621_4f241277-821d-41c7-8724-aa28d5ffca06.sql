
-- Update platform email settings to use the correct domain
UPDATE platform_settings 
SET setting_value = '"nuthatch@grace-os.co.uk"'
WHERE setting_key = 'from_email';

-- Also update the from_name if it exists
UPDATE platform_settings 
SET setting_value = '"Grace OS"'
WHERE setting_key = 'from_name' AND setting_value IS NULL;

-- Insert the settings if they don't exist
INSERT INTO platform_settings (setting_key, setting_value, setting_type, description, is_public)
SELECT 'from_email', '"nuthatch@grace-os.co.uk"', 'string', 'Default from email address for platform emails', false
WHERE NOT EXISTS (SELECT 1 FROM platform_settings WHERE setting_key = 'from_email');

INSERT INTO platform_settings (setting_key, setting_value, setting_type, description, is_public)
SELECT 'from_name', '"Grace OS"', 'string', 'Default from name for platform emails', false
WHERE NOT EXISTS (SELECT 1 FROM platform_settings WHERE setting_key = 'from_name');
