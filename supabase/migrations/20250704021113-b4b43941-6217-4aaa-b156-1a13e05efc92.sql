
-- Create venue_settings table for storing operating hours and other venue configuration
CREATE TABLE public.venue_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.venue_settings ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all users to view and manage venue settings
CREATE POLICY "Allow all users to view venue_settings" 
  ON public.venue_settings 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow all users to create venue_settings" 
  ON public.venue_settings 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow all users to update venue_settings" 
  ON public.venue_settings 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow all users to delete venue_settings" 
  ON public.venue_settings 
  FOR DELETE 
  USING (true);

-- Insert default operating hours
INSERT INTO public.venue_settings (setting_key, setting_value) 
VALUES ('operating_hours', '{"start_time": "17:00", "end_time": "23:00"}');
