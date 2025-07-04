
-- Create guests table to store guest information
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  opt_in_marketing BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create guest_tags junction table to link guests with tags
CREATE TABLE public.guest_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  assigned_by TEXT, -- 'system' or 'manual'
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(guest_id, tag_id)
);

-- Add is_automatic field to tags table to distinguish system vs manual tags
ALTER TABLE public.tags ADD COLUMN is_automatic BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX idx_guests_email ON public.guests(email);
CREATE INDEX idx_guests_phone ON public.guests(phone);
CREATE INDEX idx_guest_tags_guest_id ON public.guest_tags(guest_id);
CREATE INDEX idx_guest_tags_tag_id ON public.guest_tags(tag_id);

-- Enable RLS on new tables
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for guests table
CREATE POLICY "Allow all users to view guests" ON public.guests FOR SELECT USING (true);
CREATE POLICY "Allow all users to create guests" ON public.guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all users to update guests" ON public.guests FOR UPDATE USING (true);
CREATE POLICY "Allow all users to delete guests" ON public.guests FOR DELETE USING (true);

-- Create RLS policies for guest_tags table
CREATE POLICY "Allow all users to view guest_tags" ON public.guest_tags FOR SELECT USING (true);
CREATE POLICY "Allow all users to create guest_tags" ON public.guest_tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all users to update guest_tags" ON public.guest_tags FOR UPDATE USING (true);
CREATE POLICY "Allow all users to delete guest_tags" ON public.guest_tags FOR DELETE USING (true);

-- Insert predefined automatic tags
INSERT INTO public.tags (name, color, is_automatic) VALUES
('First-Time', '#10B981', true),
('Repeat', '#3B82F6', true),
('Frequent', '#8B5CF6', true),
('Recent', '#06B6D4', true),
('Lapsed', '#6B7280', true),
('Bulk Booker', '#F59E0B', true),
('Early Bird', '#84CC16', true),
('Last-Minute Booker', '#EF4444', true),
('No-Show Risk', '#DC2626', true),
('Flock Member', '#EC4899', true);

-- Insert predefined manual tags
INSERT INTO public.tags (name, color, is_automatic) VALUES
('VIP', '#FFD700', false),
('Birthday', '#FF69B4', false),
('Anniversary', '#FF1493', false),
('Corporate Guest', '#4B5563', false),
('Vegetarian', '#22C55E', false),
('Vegan', '#16A34A', false),
('Gluten-Free', '#FCD34D', false),
('Nut Allergy', '#F87171', false),
('Allergens', '#FCA5A5', false);

-- Function to calculate guest statistics from bookings
CREATE OR REPLACE FUNCTION public.calculate_guest_stats(guest_email TEXT, guest_phone TEXT)
RETURNS TABLE(
  visit_count INTEGER,
  last_visit_date DATE,
  no_show_count INTEGER,
  early_bird_count INTEGER,
  last_minute_count INTEGER,
  bulk_booking_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as visit_count,
    MAX(booking_date)::DATE as last_visit_date,
    COUNT(CASE WHEN status = 'no_show' THEN 1 END)::INTEGER as no_show_count,
    COUNT(CASE WHEN booking_time < '18:00'::TIME THEN 1 END)::INTEGER as early_bird_count,
    COUNT(CASE WHEN created_at >= (booking_date + booking_time - INTERVAL '24 hours') THEN 1 END)::INTEGER as last_minute_count,
    COUNT(CASE WHEN party_size >= 8 THEN 1 END)::INTEGER as bulk_booking_count
  FROM public.bookings 
  WHERE (email = guest_email OR phone = guest_phone)
    AND status IN ('confirmed', 'finished', 'no_show');
END;
$$ LANGUAGE plpgsql;

-- Function to automatically assign tags based on booking data
CREATE OR REPLACE FUNCTION public.assign_automatic_tags(guest_id_param UUID)
RETURNS VOID AS $$
DECLARE
  guest_record RECORD;
  stats_record RECORD;
  tag_record RECORD;
BEGIN
  -- Get guest info
  SELECT * INTO guest_record FROM public.guests WHERE id = guest_id_param;
  
  -- Get guest statistics
  SELECT * INTO stats_record FROM public.calculate_guest_stats(guest_record.email, guest_record.phone);
  
  -- Remove all existing automatic tags for this guest
  DELETE FROM public.guest_tags 
  WHERE guest_id = guest_id_param 
    AND assigned_by = 'system';
  
  -- Assign tags based on criteria
  FOR tag_record IN SELECT * FROM public.tags WHERE is_automatic = true LOOP
    CASE tag_record.name
      WHEN 'First-Time' THEN
        IF stats_record.visit_count = 1 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Repeat' THEN
        IF stats_record.visit_count BETWEEN 2 AND 4 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Frequent' THEN
        IF stats_record.visit_count >= 5 AND stats_record.last_visit_date >= CURRENT_DATE - INTERVAL '6 months' THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Recent' THEN
        IF stats_record.last_visit_date >= CURRENT_DATE - INTERVAL '30 days' THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Lapsed' THEN
        IF stats_record.last_visit_date < CURRENT_DATE - INTERVAL '6 months' THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Bulk Booker' THEN
        IF stats_record.bulk_booking_count > 0 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Early Bird' THEN
        IF stats_record.early_bird_count >= 3 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'Last-Minute Booker' THEN
        IF stats_record.last_minute_count >= 3 THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
      
      WHEN 'No-Show Risk' THEN
        IF stats_record.no_show_count >= 2 AND stats_record.last_visit_date >= CURRENT_DATE - INTERVAL '6 months' THEN
          INSERT INTO public.guest_tags (guest_id, tag_id, assigned_by) 
          VALUES (guest_id_param, tag_record.id, 'system');
        END IF;
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
