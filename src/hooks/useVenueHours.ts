
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useVenueHours = () => {
  return useQuery({
    queryKey: ['venue-hours'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_settings')
        .select('setting_value')
        .eq('setting_key', 'operating_hours')
        .maybeSingle();
      
      if (error) throw error;
      
      // Default hours if not set
      const defaultHours = { start_time: "17:00", end_time: "23:00" };
      return (data?.setting_value as { start_time: string; end_time: string }) || defaultHours;
    }
  });
};
