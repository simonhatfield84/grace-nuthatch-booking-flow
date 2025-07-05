
-- Drop the problematic RLS policy that causes infinite recursion
DROP POLICY IF EXISTS "Super admins can manage platform admins" ON public.platform_admins;

-- Create a simpler policy that allows authenticated users to read platform_admins
-- This avoids the infinite recursion issue
CREATE POLICY "Authenticated users can read platform admins"
  ON public.platform_admins
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to manage their own platform admin records
CREATE POLICY "Users can manage their own platform admin status"
  ON public.platform_admins
  FOR ALL
  USING (user_id = auth.uid());
