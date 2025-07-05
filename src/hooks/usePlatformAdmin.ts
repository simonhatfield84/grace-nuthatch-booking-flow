
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePlatformAdmin = () => {
  return useQuery({
    queryKey: ['platform-admin-check'],
    queryFn: async () => {
      console.log('Checking platform admin status...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        return false;
      }
      
      if (!user) {
        console.log('No authenticated user found');
        return false;
      }

      console.log('User found, checking platform admin status for user:', user.id);

      const { data, error } = await supabase
        .from('platform_admins')
        .select('is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking platform admin status:', error);
        return false;
      }

      const isAdmin = !!data;
      console.log('Platform admin check result:', isAdmin);
      
      return isAdmin;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
