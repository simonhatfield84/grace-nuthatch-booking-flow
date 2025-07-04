
-- Create booking_audit table for tracking all changes
CREATE TABLE public.booking_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL, -- 'created', 'updated', 'status_changed', 'deleted'
  field_name TEXT, -- which field was changed
  old_value TEXT, -- previous value
  new_value TEXT, -- new value
  changed_by TEXT, -- user who made the change (for future auth integration)
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT -- additional context
);

-- Add RLS policies for booking_audit
ALTER TABLE public.booking_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all users to view booking_audit" 
  ON public.booking_audit 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow all users to create booking_audit" 
  ON public.booking_audit 
  FOR INSERT 
  WITH CHECK (true);

-- Create blocks table for storing blocked time slots
CREATE TABLE public.blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  table_ids INTEGER[] DEFAULT '{}', -- empty array means all tables
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for blocks
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all users to view blocks" 
  ON public.blocks 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow all users to create blocks" 
  ON public.blocks 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow all users to update blocks" 
  ON public.blocks 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow all users to delete blocks" 
  ON public.blocks 
  FOR DELETE 
  USING (true);

-- Add booking_reference column to bookings table for human-readable IDs
ALTER TABLE public.bookings 
ADD COLUMN booking_reference TEXT;

-- Create a function to generate booking references
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
DECLARE
  ref_number INTEGER;
  year_part TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Get the next sequential number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(booking_reference FROM '\d+$') AS INTEGER)), 0) + 1
  INTO ref_number
  FROM public.bookings 
  WHERE booking_reference LIKE 'BK-' || year_part || '-%';
  
  RETURN 'BK-' || year_part || '-' || LPAD(ref_number::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Update existing bookings to have booking references
UPDATE public.bookings 
SET booking_reference = generate_booking_reference()
WHERE booking_reference IS NULL;

-- Add trigger to auto-generate booking references for new bookings
CREATE OR REPLACE FUNCTION set_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_reference IS NULL THEN
    NEW.booking_reference := generate_booking_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_reference_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_reference();
