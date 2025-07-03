
-- Create tags table for centralized tag management
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_tags junction table
CREATE TABLE public.service_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_id, tag_id)
);

-- Add indexes for better performance
CREATE INDEX idx_service_tags_service_id ON public.service_tags(service_id);
CREATE INDEX idx_service_tags_tag_id ON public.service_tags(tag_id);

-- Create a function to get tag usage count
CREATE OR REPLACE FUNCTION public.get_tag_usage_count(tag_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COUNT(*)::INTEGER FROM public.service_tags WHERE tag_id = $1;
$$;

-- Enable RLS on tags table
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tags (allow all authenticated users to read/write for now)
CREATE POLICY "Authenticated users can view tags" ON public.tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create tags" ON public.tags
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update tags" ON public.tags
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete tags" ON public.tags
  FOR DELETE TO authenticated USING (true);

-- Create RLS policies for service_tags
CREATE POLICY "Authenticated users can view service_tags" ON public.service_tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create service_tags" ON public.service_tags
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update service_tags" ON public.service_tags
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete service_tags" ON public.service_tags
  FOR DELETE TO authenticated USING (true);
