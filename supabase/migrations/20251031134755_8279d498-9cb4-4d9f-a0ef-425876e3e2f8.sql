-- Create square_location_map table
CREATE TABLE IF NOT EXISTS public.square_location_map (
  square_location_id TEXT PRIMARY KEY,
  grace_venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE
);

-- Create square_device_map table
CREATE TABLE IF NOT EXISTS public.square_device_map (
  id BIGSERIAL PRIMARY KEY,
  square_location_id TEXT NOT NULL,
  square_device_id TEXT,
  square_source_name TEXT,
  grace_area_id INTEGER REFERENCES public.sections(id) ON DELETE SET NULL,
  grace_table_id INTEGER REFERENCES public.tables(id) ON DELETE SET NULL,
  CONSTRAINT device_or_source_required CHECK (
    square_device_id IS NOT NULL OR square_source_name IS NOT NULL
  )
);

-- Create unique indexes for device mappings (separate for device_id and source_name)
CREATE UNIQUE INDEX IF NOT EXISTS idx_square_device_map_unique_device 
  ON public.square_device_map(square_location_id, square_device_id) 
  WHERE square_device_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_square_device_map_unique_source 
  ON public.square_device_map(square_location_id, square_source_name) 
  WHERE square_source_name IS NOT NULL;

-- Create seating_policy enum type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seating_policy') THEN
    CREATE TYPE public.seating_policy AS ENUM (
      'unassigned',
      'default_table',
      'least_loaded_in_area'
    );
  END IF;
END $$;

-- Create square_seating_policy table
CREATE TABLE IF NOT EXISTS public.square_seating_policy (
  grace_venue_id UUID PRIMARY KEY REFERENCES public.venues(id) ON DELETE CASCADE,
  policy public.seating_policy NOT NULL DEFAULT 'unassigned',
  default_area_id INTEGER REFERENCES public.sections(id) ON DELETE SET NULL,
  default_table_id INTEGER REFERENCES public.tables(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT policy_requirements CHECK (
    (policy = 'default_table' AND default_table_id IS NOT NULL) OR
    (policy = 'least_loaded_in_area' AND default_area_id IS NOT NULL) OR
    (policy = 'unassigned')
  )
);

-- Enable RLS on square_location_map
ALTER TABLE public.square_location_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venue users can view their location mappings"
  ON public.square_location_map FOR SELECT
  USING (grace_venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Venue admins can manage location mappings"
  ON public.square_location_map FOR ALL
  USING (grace_venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), grace_venue_id));

-- Enable RLS on square_device_map
ALTER TABLE public.square_device_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venue users can view their device mappings"
  ON public.square_device_map FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.square_location_map 
    WHERE square_location_map.square_location_id = square_device_map.square_location_id
    AND square_location_map.grace_venue_id = get_user_venue(auth.uid())
  ));

CREATE POLICY "Venue admins can manage device mappings"
  ON public.square_device_map FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.square_location_map 
    WHERE square_location_map.square_location_id = square_device_map.square_location_id
    AND square_location_map.grace_venue_id = get_user_venue(auth.uid())
    AND is_admin(auth.uid(), square_location_map.grace_venue_id)
  ));

-- Enable RLS on square_seating_policy
ALTER TABLE public.square_seating_policy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venue users can view their seating policy"
  ON public.square_seating_policy FOR SELECT
  USING (grace_venue_id = get_user_venue(auth.uid()));

CREATE POLICY "Venue admins can manage seating policy"
  ON public.square_seating_policy FOR ALL
  USING (grace_venue_id = get_user_venue(auth.uid()) AND is_admin(auth.uid(), grace_venue_id));

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_square_device_map_location 
  ON public.square_device_map(square_location_id);