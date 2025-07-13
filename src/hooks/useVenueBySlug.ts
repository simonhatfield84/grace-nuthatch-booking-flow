
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useVenueBySlug = (venueSlug: string) => {
  return useQuery({
    queryKey: ['venue-by-slug', venueSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, slug, approval_status')
        .eq('slug', venueSlug)
        .eq('approval_status', 'approved')
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!venueSlug,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
};
