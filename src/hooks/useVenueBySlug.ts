
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useVenueBySlug = (venueSlug: string) => {
  return useQuery({
    queryKey: ['venue-by-slug', venueSlug],
    queryFn: async () => {
      console.log(`🏢 Looking up venue by slug: ${venueSlug}`);
      
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, slug, approval_status')
        .eq('slug', venueSlug)
        .eq('approval_status', 'approved')
        .single();
      
      if (error) {
        console.error('Error fetching venue by slug:', error);
        throw error;
      }
      
      console.log(`✅ Found venue:`, data);
      return data;
    },
    enabled: !!venueSlug,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 3, // Retry failed requests
  });
};
