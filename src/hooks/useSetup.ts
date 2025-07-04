
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
