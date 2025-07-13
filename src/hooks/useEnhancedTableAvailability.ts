
import { useQuery } from "@tanstack/react-query";
import { TableAvailabilityService } from "@/services/tableAvailabilityService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useEnhancedTableAvailability = () => {
  const { user } = useAuth();

  // Get user's venue ID
  const { data: userVenue } = useQuery({
    queryKey: ['user-venue', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('venue_id')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data?.venue_id;
    },
    enabled: !!user,
  });

  const checkEnhancedAvailability = async (
    partySize: number,
    bookingDate: string,
    bookingTime: string,
    durationMinutes?: number
  ) => {
    if (!userVenue) throw new Error('No venue associated with user');
    
    return await TableAvailabilityService.getEnhancedTableAllocation(
      partySize,
      bookingDate,
      bookingTime,
      userVenue,
      durationMinutes
    );
  };

  const getRealTimeAvailability = async (
    date: string,
    startTime: string,
    endTime: string,
    partySize: number
  ) => {
    if (!userVenue) throw new Error('No venue associated with user');
    
    return await TableAvailabilityService.getRealTimeAvailability(
      userVenue,
      date,
      startTime,
      endTime,
      partySize
    );
  };

  return {
    userVenue,
    checkEnhancedAvailability,
    getRealTimeAvailability
  };
};
