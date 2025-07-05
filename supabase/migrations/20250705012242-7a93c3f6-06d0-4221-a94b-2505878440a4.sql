
-- Add a setup-specific RLS policy for profiles that allows users to create their own profile
-- This fixes the circular dependency during initial setup
CREATE POLICY "Users can create their own profile during setup" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (id = auth.uid());

-- This policy will be checked before the admin policy, allowing the initial profile creation
-- while maintaining security for all other operations
