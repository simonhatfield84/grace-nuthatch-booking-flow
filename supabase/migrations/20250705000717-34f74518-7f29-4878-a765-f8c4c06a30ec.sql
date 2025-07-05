
-- Add venue_id column to venue_settings table
ALTER TABLE public.venue_settings 
ADD COLUMN venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE;

-- Update existing settings to have a venue_id (if any exist)
-- This will set all existing settings to the first venue found
-- You may need to adjust this based on your specific needs
UPDATE public.venue_settings 
SET venue_id = (SELECT id FROM public.venues LIMIT 1)
WHERE venue_id IS NULL;

-- Make venue_id required for new records
ALTER TABLE public.venue_settings 
ALTER COLUMN venue_id SET NOT NULL;

-- Update the unique constraint to include venue_id
-- This allows multiple venues to have the same setting keys
DROP INDEX IF EXISTS venue_settings_setting_key_key;
ALTER TABLE public.venue_settings 
ADD CONSTRAINT venue_settings_venue_setting_unique UNIQUE (venue_id, setting_key);

-- Update RLS policies to be venue-specific
DROP POLICY IF EXISTS "Allow all users to view venue_settings" ON public.venue_settings;
DROP POLICY IF EXISTS "Allow all users to create venue_settings" ON public.venue_settings;
DROP POLICY IF EXISTS "Allow all users to update venue_settings" ON public.venue_settings;
DROP POLICY IF EXISTS "Allow all users to delete venue_settings" ON public.venue_settings;

-- Create venue-specific RLS policies
CREATE POLICY "Users can view their venue settings" 
  ON public.venue_settings 
  FOR SELECT 
  USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Users can create their venue settings" 
  ON public.venue_settings 
  FOR INSERT 
  WITH CHECK (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Users can update their venue settings" 
  ON public.venue_settings 
  FOR UPDATE 
  USING (venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Users can delete their venue settings" 
  ON public.venue_settings 
  FOR DELETE 
  USING (venue_id = get_user_venue(auth.uid()));
