
-- Create sections table for organizing tables
CREATE TABLE public.sections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booking priorities table for managing priority by party size
CREATE TABLE public.booking_priorities (
  id SERIAL PRIMARY KEY,
  party_size INTEGER NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('table', 'group')),
  item_id INTEGER NOT NULL,
  priority_rank INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(party_size, item_type, item_id)
);

-- Add section_id to existing tables (we'll assume tables are stored somewhere)
-- Since tables are currently stored in component state, we'll add section support to the table structure

-- Add RLS policies for sections
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all users to view sections" 
  ON public.sections 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow all users to create sections" 
  ON public.sections 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow all users to update sections" 
  ON public.sections 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow all users to delete sections" 
  ON public.sections 
  FOR DELETE 
  USING (true);

-- Add RLS policies for booking priorities
ALTER TABLE public.booking_priorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all users to view booking_priorities" 
  ON public.booking_priorities 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow all users to create booking_priorities" 
  ON public.booking_priorities 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow all users to update booking_priorities" 
  ON public.booking_priorities 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow all users to delete booking_priorities" 
  ON public.booking_priorities 
  FOR DELETE 
  USING (true);

-- Insert some default sections
INSERT INTO public.sections (name, description, color, sort_order) VALUES
  ('Restaurant', 'Main dining area tables', '#10B981', 1),
  ('Bar Area', 'Bar seating and high tops', '#F59E0B', 2),
  ('Patio', 'Outdoor seating area', '#8B5CF6', 3);
