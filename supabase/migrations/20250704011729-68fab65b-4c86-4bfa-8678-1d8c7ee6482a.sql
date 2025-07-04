
-- Create tables table for persistent storage
CREATE TABLE public.tables (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  seats INTEGER NOT NULL CHECK (seats > 0),
  online_bookable BOOLEAN DEFAULT true,
  priority_rank INTEGER DEFAULT 1,
  section_id INTEGER REFERENCES public.sections(id) ON DELETE SET NULL,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  join_groups INTEGER[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bookings table for future bookings management
CREATE TABLE public.bookings (
  id SERIAL PRIMARY KEY,
  table_id INTEGER REFERENCES public.tables(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'seated', 'finished', 'cancelled', 'late')),
  is_unallocated BOOLEAN DEFAULT false,
  original_table_id INTEGER,
  phone TEXT,
  email TEXT,
  notes TEXT,
  service TEXT DEFAULT 'Dinner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for tables
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tables
CREATE POLICY "Allow all users to view tables" 
  ON public.tables 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow all users to create tables" 
  ON public.tables 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow all users to update tables" 
  ON public.tables 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow all users to delete tables" 
  ON public.tables 
  FOR DELETE 
  USING (true);

-- Enable RLS for bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bookings
CREATE POLICY "Allow all users to view bookings" 
  ON public.bookings 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow all users to create bookings" 
  ON public.bookings 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow all users to update bookings" 
  ON public.bookings 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow all users to delete bookings" 
  ON public.bookings 
  FOR DELETE 
  USING (true);

-- Create function to handle table deletion with future bookings
CREATE OR REPLACE FUNCTION public.handle_table_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there are future bookings for this table
  IF EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE table_id = OLD.id 
    AND booking_date >= CURRENT_DATE 
    AND status NOT IN ('cancelled', 'finished')
  ) THEN
    -- Mark bookings as unallocated instead of deleting the table
    UPDATE public.bookings 
    SET is_unallocated = true, 
        original_table_id = table_id,
        table_id = NULL,
        updated_at = now()
    WHERE table_id = OLD.id 
    AND booking_date >= CURRENT_DATE 
    AND status NOT IN ('cancelled', 'finished');
    
    -- Soft delete the table instead of hard delete
    UPDATE public.tables 
    SET status = 'deleted', 
        deleted_at = now(),
        updated_at = now()
    WHERE id = OLD.id;
    
    -- Prevent the actual DELETE
    RETURN NULL;
  END IF;
  
  -- Allow normal deletion if no future bookings
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for table deletion protection
CREATE TRIGGER protect_tables_with_bookings
  BEFORE DELETE ON public.tables
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_table_deletion();

-- Insert sample tables across different sections
INSERT INTO public.tables (label, seats, online_bookable, priority_rank, section_id, position_x, position_y, join_groups) VALUES
('T1', 2, true, 1, 1, 100, 100, '{}'),
('T2', 2, true, 2, 1, 200, 100, '{1,2}'),
('T3', 4, true, 3, 1, 100, 200, '{1,2}'),
('T4', 4, true, 4, 1, 200, 200, '{1,2}'),
('T5', 6, true, 5, 2, 300, 150, '{}'),
('T6', 8, false, 6, 3, 400, 150, '{}');
