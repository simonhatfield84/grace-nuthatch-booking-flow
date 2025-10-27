-- Add source column to track booking origin
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'widget';

-- Add check constraint to ensure valid values
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_source_check 
CHECK (source IN ('widget', 'admin', 'api', 'phone', 'walk_in', 'other'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_source 
ON public.bookings(source);

-- Update existing bookings to have a source (assume admin-created)
UPDATE public.bookings 
SET source = 'admin' 
WHERE source IS NULL;

-- Add service_id column for proper relational integrity
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_service_id 
ON public.bookings(service_id);

-- Update existing bookings to link service_id based on service text
UPDATE public.bookings b
SET service_id = s.id
FROM public.services s
WHERE b.service_id IS NULL 
  AND b.service IS NOT NULL
  AND LOWER(TRIM(b.service)) = LOWER(TRIM(s.title))
  AND b.venue_id = s.venue_id;