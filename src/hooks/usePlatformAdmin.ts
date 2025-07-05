
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePlatformAdmin = () => {
  return useQuery({
    queryKey: ['platform-admin-check'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

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

      return !!data;
    },
    retry: false,
  });
};
