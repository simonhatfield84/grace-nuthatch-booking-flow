
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view tags" ON public.tags;
DROP POLICY IF EXISTS "Authenticated users can create tags" ON public.tags;
DROP POLICY IF EXISTS "Authenticated users can update tags" ON public.tags;
DROP POLICY IF EXISTS "Authenticated users can delete tags" ON public.tags;

DROP POLICY IF EXISTS "Authenticated users can view service_tags" ON public.service_tags;
DROP POLICY IF EXISTS "Authenticated users can create service_tags" ON public.service_tags;
DROP POLICY IF EXISTS "Authenticated users can update service_tags" ON public.service_tags;
DROP POLICY IF EXISTS "Authenticated users can delete service_tags" ON public.service_tags;

-- Create more permissive policies that allow both authenticated and anonymous users
CREATE POLICY "Allow all users to view tags" ON public.tags
  FOR SELECT USING (true);

CREATE POLICY "Allow all users to create tags" ON public.tags
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update tags" ON public.tags
  FOR UPDATE USING (true);

CREATE POLICY "Allow all users to delete tags" ON public.tags
  FOR DELETE USING (true);

-- Create policies for service_tags
CREATE POLICY "Allow all users to view service_tags" ON public.service_tags
  FOR SELECT USING (true);

CREATE POLICY "Allow all users to create service_tags" ON public.service_tags
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update service_tags" ON public.service_tags
  FOR UPDATE USING (true);

CREATE POLICY "Allow all users to delete service_tags" ON public.service_tags
  FOR DELETE USING (true);
