
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSetup = () => {
  return useQuery({
    queryKey: ['setup-complete'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('setup_complete');
      if (error) throw error;
      return data;
    },
    retry: false,
  });
};

export const useUserStatus = () => {
  return useQuery({
    queryKey: ['user-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('status, venue_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    retry: false,
  });
};
