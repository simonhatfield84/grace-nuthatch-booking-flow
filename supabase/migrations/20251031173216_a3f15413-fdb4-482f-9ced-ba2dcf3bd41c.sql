-- Create square_table_map table for table name mappings
CREATE TABLE IF NOT EXISTS public.square_table_map (
  id BIGSERIAL PRIMARY KEY,
  square_location_id TEXT NOT NULL,
  square_table_name TEXT NOT NULL,
  grace_table_id INTEGER REFERENCES public.tables(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(square_location_id, square_table_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_square_table_map_location ON public.square_table_map(square_location_id);
CREATE INDEX IF NOT EXISTS idx_square_table_map_table ON public.square_table_map(grace_table_id);

-- Enable RLS
ALTER TABLE public.square_table_map ENABLE ROW LEVEL SECURITY;

-- Policy: Venue staff can manage table mappings
CREATE POLICY "venue_staff_manage_table_map"
  ON public.square_table_map
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);