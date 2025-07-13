
import { useQuery } from "@tanstack/react-query";
import { OptimizedAvailabilityService } from "@/services/optimizedAvailabilityService";
import { supabase } from "@/integrations/supabase/client";

export const useOptimizedAvailability = () => {
  // Get first venue ID for public bookings
  const { data: firstVenue } = useQuery({
    queryKey: ['first-venue-optimized'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name')
        .eq('approval_status', 'approved')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // Cache venue data for 10 minutes
  });

  const getAvailableDates = async (partySize: number, venueId?: string) => {
    const targetVenueId = venueId || firstVenue?.id;
    if (!targetVenueId) throw new Error('No venue available');
    
    return await OptimizedAvailabilityService.getAvailableDatesInChunks(
      targetVenueId,
      partySize
    );
  };

  const clearCache = () => {
    OptimizedAvailabilityService.clearCache();
  };

  return {
    firstVenue,
    getAvailableDates,
    clearCache
  };
};
